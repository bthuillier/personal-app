package album

import cats.effect.IO
import cats.effect.std.AtomicCell
import wishlist.WishlistAlbum
import eventbus.EventBus
import json.GitCommitter
import filedb.{FileDB, FileTable}
import java.time.LocalDate
import io.circe.Codec
import sttp.tapir.Schema
import utils.GenerateId
import org.typelevel.log4cats.Logger
import org.typelevel.log4cats.slf4j.Slf4jLogger

class AlbumService(
    table: FileTable[IO, PartialAlbum],
    cache: AtomicCell[IO, Map[String, PartialAlbum]],
    logger: Logger[IO]
)(using git: GitCommitter) {

  def list: IO[List[PartialAlbum]] = cache.get.map(_.values.toList)

  def getById(albumId: String): IO[Option[PartialAlbum]] =
    cache.get.map(_.get(albumId))

  def add(partialAlbum: PartialAlbum): IO[Unit] =
    cache.evalUpdate { state =>
      table.create(partialAlbum.id, partialAlbum).flatMap { path =>
        commit(
          path,
          s"Add album: ${partialAlbum.name} by ${partialAlbum.artist}"
        )
      }.as(state.updated(partialAlbum.id, partialAlbum))
    }

  def addGenre(albumId: String, genre: String): IO[Unit] =
    modify(albumId, _.addGenre(genre)) { updated =>
      s"Add genre '$genre' to album '${updated.name}'"
    }

  def removeGenre(albumId: String, genre: String): IO[Unit] =
    modify(albumId, _.removeGenre(genre)) { updated =>
      s"Remove genre '$genre' from album '${updated.name}'"
    }

  def setReview(albumId: String, review: Review): IO[Unit] =
    modify(albumId, _.setReview(review)) { updated =>
      s"Set review (rating ${review.rating}) on album '${updated.name}'"
    }

  def create(request: AlbumService.CreateAlbum): IO[Unit] =
    add(request.toAlbum)

  private def modify(
      albumId: String,
      f: PartialAlbum => PartialAlbum
  )(msg: PartialAlbum => String): IO[Unit] =
    cache.evalModify { state =>
      state.get(albumId) match {
        case None => IO.raiseError(Errors.albumNotFound(albumId))
        case Some(album) =>
          val updated = f(album)
          persist(updated, msg(updated)).as(state.updated(albumId, updated) -> ())
      }
    }

  private def persist(album: PartialAlbum, msg: String): IO[Unit] =
    table.update(album.id, album).flatMap(commit(_, msg))

  private def commit(path: java.nio.file.Path, msg: String): IO[Unit] =
    git
      .commitFile(path.toString, msg)
      .handleErrorWith { e =>
        logger.warn(s"Git commit failed for $path — ${e.getMessage}")
      }

}

object AlbumService {

  final case class CreateAlbum(
      name: String,
      artist: String,
      format: AlbumFormat,
      releaseDate: LocalDate
  ) derives Codec.AsObject,
        Schema {
    def toAlbum: PartialAlbum =
      PartialAlbum(
        GenerateId.makeId(name, artist, format.toString)(),
        name,
        artist,
        format,
        releaseDate,
        None,
        None
      )
  }

  extension (albumService: AlbumService) {
    def addHandler(eventBus: EventBus[WishlistAlbum]) =
      eventBus
        .subscribe { album =>
          albumService.add(
            PartialAlbum.fromWishlist(album)
          )
        }
        .compile
        .drain
  }

  def fileBacked(db: FileDB[IO])(using GitCommitter): IO[AlbumService] =
    for {
      logger <- Slf4jLogger.create[IO]
      table <- db.table[PartialAlbum]("albums")
      entries <- table.list
      cache <- AtomicCell[IO].of(entries.map(a => a.id -> a).toMap)
    } yield new AlbumService(table, cache, logger)

}
