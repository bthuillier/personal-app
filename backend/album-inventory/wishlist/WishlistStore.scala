package wishlist

import cats.effect.IO
import scala.collection.mutable
import json.{JsonLoader, GitCommitter}

trait WishlistStore {
  def list: IO[List[WishlistAlbum]]
  def add(wishlistAlbum: WishlistAlbum): IO[Unit]
  def updateStatus(
      name: String,
      artist: String,
      status: WishlistStatus
  ): IO[Unit]
  def get(name: String, artist: String): IO[Option[WishlistAlbum]]
  def delete(name: String, artist: String): IO[Unit]
}

object WishlistStore {

  private class InMemoryWishlistStore(initialState: Set[WishlistAlbum])
      extends WishlistStore {

    override def list: IO[List[WishlistAlbum]] = IO(albums.values.toList)

    override def get(name: String, artist: String): IO[Option[WishlistAlbum]] =
      IO(albums.get((name, artist)))

    override def delete(name: String, artist: String): IO[Unit] = IO {
      albums.remove((name, artist))
    }

    override def add(wishlistAlbum: WishlistAlbum): IO[Unit] = IO {
      albums.update(
        (wishlistAlbum.name, wishlistAlbum.artist),
        wishlistAlbum
      )
    }

    override def updateStatus(
        name: String,
        artist: String,
        status: WishlistStatus
    ): IO[Unit] = IO {
      albums.get((name, artist)).foreach { album =>
        albums.update(
          (name, artist),
          album.copy(status = status)
        )
      }
    }

    private val albums: mutable.Map[(String, String), WishlistAlbum] =
      mutable.Map.from(
        initialState.map(album => (album.name, album.artist) -> album)
      )

  }

  private class FileBackedWishlistStore(
      filePath: String,
      internalStore: WishlistStore
  )(using GitCommitter) extends WishlistStore {

    override def list: IO[List[WishlistAlbum]] = internalStore.list

    override def add(wishlistAlbum: WishlistAlbum): IO[Unit] =
      internalStore.add(wishlistAlbum) *>
        internalStore.list.flatMap { albums =>
          JsonLoader.saveJsonFileAndCommit(
            filePath,
            albums,
            s"Add to wishlist: ${wishlistAlbum.name} by ${wishlistAlbum.artist}"
          )
        }

    override def updateStatus(
        name: String,
        artist: String,
        status: WishlistStatus
    ): IO[Unit] =
      internalStore.updateStatus(name, artist, status) *>
        internalStore.list.flatMap { albums =>
          JsonLoader.saveJsonFileAndCommit(
            filePath,
            albums,
            s"Update wishlist status: $name by $artist -> $status"
          )
        }

    override def get(name: String, artist: String): IO[Option[WishlistAlbum]] =
      internalStore.get(name, artist)

    override def delete(name: String, artist: String): IO[Unit] =
      internalStore.delete(name, artist) *>
        internalStore.list.flatMap { albums =>
          JsonLoader.saveJsonFileAndCommit(
            filePath,
            albums,
            s"Remove from wishlist: $name by $artist"
          )
        }
  }

  def fileBacked(
      filePath: String
  )(using GitCommitter): IO[WishlistStore] = {
    JsonLoader
      .loadJsonFile[List[WishlistAlbum]](filePath)
      .recover { case _: Throwable =>
        List.empty[WishlistAlbum]
      }
      .map { initialAlbums =>
        FileBackedWishlistStore(filePath, inMemory(initialAlbums.toSet))
      }
  }

  def inMemory(initialState: Set[WishlistAlbum] = Set.empty): WishlistStore =
    InMemoryWishlistStore(initialState)

}
