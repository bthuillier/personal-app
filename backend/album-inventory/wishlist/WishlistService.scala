package wishlist

import cats.effect.IO
import album.AlbumFormat
import java.time.LocalDate
import io.circe.Codec
import sttp.tapir.Schema
import eventbus.EventBus
import json.GitCommitter
import org.typelevel.log4cats.Logger
import org.typelevel.log4cats.slf4j.Slf4jLogger

class WishlistService(store: WishlistStore, eventBus: EventBus[WishlistAlbum], logger: Logger[IO]) {

  def list: IO[List[WishlistAlbum]] = store.list
  def addAlbumToWishlist(album: WishlistService.AddAlbumToWishlist): IO[Unit] =
    store.add(album.toAlbum)
  def confirmAlbumReceived(name: String, artist: String): IO[Unit] =
    store.get(name, artist).flatMap {
      case Some(existingAlbum) =>
        val updatedAlbum = existingAlbum.copy(status = WishlistStatus.Received)
        logger.info(s"Confirming album received: $name by $artist") *> eventBus
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
  )(using GitCommitter): IO[WishlistService] = {
    for {
      logger <- Slf4jLogger.create[IO]
      store <- WishlistStore.fileBacked(filePath)
    } yield WishlistService(store, eventBus, logger)
  }

}
