package album

import cats.effect.IO
import wishlist.WishlistAlbum
import eventbus.EventBus

class AlbumService(store: AlbumStore) {

  def list: IO[List[PartialAlbum]] = store.list
  def add(partialAlbum: PartialAlbum): IO[Unit] = store.add(partialAlbum)

}

object AlbumService {

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

  def fileBacked(filepath: String): IO[AlbumService] =
    AlbumStore.fileBacked(filepath).map(store => AlbumService(store))

}
