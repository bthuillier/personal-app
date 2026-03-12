package wishlist

import cats.effect.IO
import album.AlbumFormat
import java.time.LocalDate
import io.circe.Codec
import sttp.tapir.Schema
import eventbus.EventBus

class WishlistService(store: WishlistStore, eventBus: EventBus[WishlistAlbum]) {

  def list: IO[List[WishlistAlbum]] = store.list
  def addAlbumToWishlist(album: WishlistService.AddAlbumToWishlist): IO[Unit] =
    store.add(album.toAlbum)
  def confirmAlbumReceived(name: String, artist: String): IO[Unit] =
    store.get(name, artist).flatMap {
      case Some(existingAlbum) =>
        val updatedAlbum = existingAlbum.copy(status = WishlistStatus.Received)
        IO.println(s"Confirming album received: $name by $artist") *> eventBus
          .publish(updatedAlbum) *> store.updateStatus(
          name,
          artist,
          WishlistStatus.Received
        ) *> store.delete(name, artist)
      case None =>
        IO.raiseError(
          new RuntimeException(
            s"Album not found in wishlist: $name by $artist"
          )
        )
    }
  def orderAlbum(name: String, artist: String): IO[Unit] =
    store.updateStatus(name, artist, WishlistStatus.Ordered)

}

object WishlistService {
  final case class AddAlbumToWishlist(
      name: String,
      artist: String,
      format: AlbumFormat,
      releaseDate: LocalDate
  ) derives Codec.AsObject,
        Schema {
    def toAlbum =
      WishlistAlbum(name, artist, format, releaseDate, WishlistStatus.Wanted)
  }

  def fileBacked(
      filePath: String,
      eventBus: EventBus[WishlistAlbum]
  ): IO[WishlistService] = {
    WishlistStore
      .fileBacked(filePath)
      .map(store => WishlistService(store, eventBus))
  }

}
