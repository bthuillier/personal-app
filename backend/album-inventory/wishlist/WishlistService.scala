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
import utils.GenerateId

class WishlistService(store: WishlistStore, eventBus: EventBus[WishlistAlbum], logger: Logger[IO]) {

  def list: IO[List[WishlistAlbum]] = store.list
  def addAlbumToWishlist(album: WishlistService.AddAlbumToWishlist): IO[Unit] =
    store.add(album.toAlbum)
  def confirmAlbumReceived(id: String): IO[Unit] =
    store.get(id).flatMap {
      case Some(existingAlbum) =>
        val updatedAlbum = existingAlbum.copy(status = WishlistStatus.Received)
        logger.info(s"Confirming album received: ${existingAlbum.name} by ${existingAlbum.artist}") *> eventBus
          .publish(updatedAlbum) *> store.updateStatus(
          id,
          WishlistStatus.Received
        ) *> store.delete(id)
      case None =>
        IO.raiseError(
          new RuntimeException(
            s"Album not found in wishlist: $id"
          )
        )
    }
  def orderAlbum(id: String): IO[Unit] =
    store.updateStatus(id, WishlistStatus.Ordered)

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
      WishlistAlbum(
        GenerateId.makeId(name, artist)(),
        name,
        artist,
        format,
        releaseDate,
        WishlistStatus.Wanted
      )
  }

  def fileBacked(
      folderPath: String,
      eventBus: EventBus[WishlistAlbum]
  )(using GitCommitter): IO[WishlistService] = {
    for {
      logger <- Slf4jLogger.create[IO]
      store <- WishlistStore.fileBacked(folderPath)
    } yield WishlistService(store, eventBus, logger)
  }

}
