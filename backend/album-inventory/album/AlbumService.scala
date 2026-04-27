package album

import cats.effect.IO
import wishlist.WishlistAlbum
import eventbus.EventBus
import json.GitCommitter
import java.time.LocalDate
import io.circe.Codec
import sttp.tapir.Schema
import utils.GenerateId

class AlbumService(store: AlbumStore) {

  def list: IO[List[PartialAlbum]] = store.list
  def add(partialAlbum: PartialAlbum): IO[Unit] = store.add(partialAlbum)
  def addGenre(albumId: String, genre: String): IO[Unit] =
    store.addGenre(albumId, genre)
  def removeGenre(albumId: String, genre: String): IO[Unit] =
    store.removeGenre(albumId, genre)
  def setReview(albumId: String, review: Review): IO[Unit] =
    store.setReview(albumId, review)
  def getById(albumId: String): IO[Option[PartialAlbum]] =
    store.getById(albumId)

  def create(request: AlbumService.CreateAlbum): IO[Unit] =
    store.add(request.toAlbum)

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

  def fileBacked(filepath: String)(using GitCommitter): IO[AlbumService] =
    AlbumStore.fileBacked(filepath).map(store => AlbumService(store))

}
