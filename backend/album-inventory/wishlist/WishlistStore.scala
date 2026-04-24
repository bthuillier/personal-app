package wishlist

import cats.effect.IO
import scala.collection.mutable
import json.{JsonLoader, GitCommitter}

trait WishlistStore {
  def list: IO[List[WishlistAlbum]]
  def add(wishlistAlbum: WishlistAlbum): IO[Unit]
  def updateStatus(
      id: String,
      status: WishlistStatus
  ): IO[Unit]
  def get(id: String): IO[Option[WishlistAlbum]]
  def delete(id: String): IO[Unit]
}

object WishlistStore {

  private class InMemoryWishlistStore(initialState: Set[WishlistAlbum])
      extends WishlistStore {

    override def list: IO[List[WishlistAlbum]] = IO(albums.values.toList)

    override def get(id: String): IO[Option[WishlistAlbum]] =
      IO(albums.get(id))

    override def delete(id: String): IO[Unit] = IO {
      albums.remove(id)
    }

    override def add(wishlistAlbum: WishlistAlbum): IO[Unit] = IO {
      albums.update(wishlistAlbum.id, wishlistAlbum)
    }

    override def updateStatus(
        id: String,
        status: WishlistStatus
    ): IO[Unit] = IO {
      albums.get(id).foreach { album =>
        albums.update(id, album.copy(status = status))
      }
    }

    private val albums: mutable.Map[String, WishlistAlbum] =
      mutable.Map.from(
        initialState.map(album => album.id -> album)
      )

  }

  private class FileBackedWishlistStore(
      folderPath: String,
      internalStore: WishlistStore
  )(using GitCommitter)
      extends WishlistStore {

    override def list: IO[List[WishlistAlbum]] = internalStore.list

    override def add(wishlistAlbum: WishlistAlbum): IO[Unit] =
      internalStore.add(wishlistAlbum) *>
        JsonLoader.saveJsonFileAndCommit(
          s"$folderPath/${wishlistAlbum.id}.json",
          wishlistAlbum,
          s"Add to wishlist: ${wishlistAlbum.name} by ${wishlistAlbum.artist}"
        )

    override def updateStatus(
        id: String,
        status: WishlistStatus
    ): IO[Unit] =
      internalStore.updateStatus(id, status) *>
        internalStore.get(id).flatMap {
          case Some(album) =>
            JsonLoader.saveJsonFileAndCommit(
              s"$folderPath/$id.json",
              album,
              s"Update wishlist status: ${album.name} by ${album.artist} -> $status"
            )
          case None => IO.unit
        }

    override def get(id: String): IO[Option[WishlistAlbum]] =
      internalStore.get(id)

    override def delete(id: String): IO[Unit] =
      internalStore.get(id).flatMap {
        case Some(album) =>
          internalStore.delete(id) *>
            IO.blocking {
              val file = new java.io.File(s"$folderPath/$id.json")
              if (file.exists()) file.delete()
            }.void *>
            summon[GitCommitter]
              .commitFile(
                s"$folderPath/$id.json",
                s"Remove from wishlist: ${album.name} by ${album.artist}"
              )
              .handleErrorWith(_ => IO.unit)
        case None => IO.unit
      }
  }

  def fileBacked(
      folderPath: String
  )(using GitCommitter): IO[WishlistStore] = {
    JsonLoader
      .loadJsonFolder[WishlistAlbum](folderPath)
      .recover { case _: Throwable =>
        List.empty[WishlistAlbum]
      }
      .map { initialAlbums =>
        FileBackedWishlistStore(folderPath, inMemory(initialAlbums.toSet))
      }
  }

  def inMemory(initialState: Set[WishlistAlbum] = Set.empty): WishlistStore =
    InMemoryWishlistStore(initialState)

}
