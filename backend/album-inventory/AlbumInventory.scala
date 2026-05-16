package albuminventory

import cats.effect.{IO, Resource}
import sttp.tapir.server.ServerEndpoint
import eventbus.EventBus
import filedb.FileDB
import json.GitCommitter
import wishlist.{AlbumWishlists, WishlistAlbum, WishlistService}

object AlbumInventory {

  val dbName = "music-inventory"

  def endpoints(
      db: FileDB[IO]
  )(using GitCommitter): Resource[IO, List[ServerEndpoint[Any, IO]]] =
    for {
      eventBus <- Resource.eval(EventBus.create[WishlistAlbum])
      wishlists <- Resource.eval(WishlistService.fileBacked(db, eventBus))
      albums <- Resource.eval(album.AlbumService.fileBacked(db))
      _ <- Resource.make(albums.addHandler(eventBus).start)(_.cancel)
    } yield AlbumWishlists.endpoints(wishlists) ++ album.Albums.endpoints(albums)

}
