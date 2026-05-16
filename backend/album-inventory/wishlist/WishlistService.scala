package wishlist

import cats.effect.IO
import cats.effect.std.AtomicCell
import album.AlbumFormat
import java.time.LocalDate
import io.circe.Codec
import sttp.tapir.Schema
import eventbus.EventBus
import json.GitCommitter
import filedb.{FileDB, FileTable}
import org.typelevel.log4cats.Logger
import org.typelevel.log4cats.slf4j.Slf4jLogger
import utils.GenerateId

class WishlistService(
    table: FileTable[IO, WishlistAlbum],
    cache: AtomicCell[IO, Map[String, WishlistAlbum]],
    eventBus: EventBus[WishlistAlbum],
    logger: Logger[IO]
)(using git: GitCommitter) {

  def list: IO[List[WishlistAlbum]] = cache.get.map(_.values.toList)

  def addAlbumToWishlist(album: WishlistService.AddAlbumToWishlist): IO[Unit] = {
    val wishlistAlbum = album.toAlbum
    cache.evalUpdate { state =>
      table.create(wishlistAlbum.id, wishlistAlbum).flatMap { path =>
        commit(
          path,
          s"Add to wishlist: ${wishlistAlbum.name} by ${wishlistAlbum.artist}"
        )
      }.as(state.updated(wishlistAlbum.id, wishlistAlbum))
    }
  }

  def orderAlbum(id: String): IO[Unit] =
    updateStatus(id, WishlistStatus.Ordered)

  def confirmAlbumReceived(id: String): IO[Unit] =
    cache.evalModify { state =>
      state.get(id) match {
        case None =>
          IO.raiseError(new RuntimeException(s"Album not found in wishlist: $id"))
        case Some(existing) =>
          val received = existing.copy(status = WishlistStatus.Received)
          logger.info(
            s"Confirming album received: ${existing.name} by ${existing.artist}"
          ) *>
            eventBus.publish(received) *>
            table.delete(id).flatMap { path =>
              commit(
                path,
                s"Remove from wishlist: ${existing.name} by ${existing.artist}"
              )
            }.as((state - id) -> ())
      }
    }

  private def updateStatus(id: String, status: WishlistStatus): IO[Unit] =
    cache.evalModify { state =>
      state.get(id) match {
        case None => IO.pure(state -> ())
        case Some(album) =>
          val updated = album.copy(status = status)
          persist(
            updated,
            s"Update wishlist status: ${updated.name} by ${updated.artist} -> $status"
          ).as(state.updated(id, updated) -> ())
      }
    }

  private def persist(album: WishlistAlbum, msg: String): IO[Unit] =
    table.update(album.id, album).flatMap(commit(_, msg))

  private def commit(path: java.nio.file.Path, msg: String): IO[Unit] =
    git
      .commitFile(path.toString, msg)
      .handleErrorWith { e =>
        logger.warn(s"Git commit failed for $path — ${e.getMessage}")
      }

}

object WishlistService {
  final case class AddAlbumToWishlist(
      name: String,
      artist: String,
      format: AlbumFormat,
      releaseDate: LocalDate,
      status: WishlistStatus
  ) derives Codec.AsObject,
        Schema {
    def toAlbum =
      WishlistAlbum(
        GenerateId.makeId(name, artist)(),
        name,
        artist,
        format,
        releaseDate,
        status
      )
  }

  def fileBacked(
      db: FileDB[IO],
      eventBus: EventBus[WishlistAlbum]
  )(using GitCommitter): IO[WishlistService] =
    for {
      logger <- Slf4jLogger.create[IO]
      table <- db.table[WishlistAlbum]("wishlist")
      entries <- table.list
      cache <- AtomicCell[IO].of(entries.map(a => a.id -> a).toMap)
    } yield new WishlistService(table, cache, eventBus, logger)

}
