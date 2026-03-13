package album

import cats.effect.*
import scala.collection.mutable
import json.{JsonLoader, GitCommitter}

trait AlbumStore {
  def list: IO[List[PartialAlbum]]
  def add(partialAlbum: PartialAlbum): IO[Unit]
}

object AlbumStore {
  private class InMemoryAlbumStore(initialState: List[PartialAlbum])
      extends AlbumStore {

    override def list: IO[List[PartialAlbum]] = IO(albums.values.toList)

    override def add(partialAlbum: PartialAlbum): IO[Unit] = IO {
      albums.update(partialAlbum.id, partialAlbum)
    }

    private val albums: mutable.Map[String, PartialAlbum] =
      mutable.Map.from(
        initialState.map(album => album.id -> album)
      )

  }

  private class FilebackedAlbumStore(
      filepath: String,
      internalStore: AlbumStore
  )(using GitCommitter) extends AlbumStore {

    override def list: IO[List[PartialAlbum]] = internalStore.list

    override def add(partialAlbum: PartialAlbum): IO[Unit] =
      internalStore.add(partialAlbum) *>
        JsonLoader.saveJsonFileAndCommit(
          s"$filepath/${partialAlbum.id}.json",
          partialAlbum,
          s"Add album: ${partialAlbum.name} by ${partialAlbum.artist}"
        )
  }

  def inMemory(initialState: List[PartialAlbum] = List.empty): AlbumStore =
    InMemoryAlbumStore(initialState)

  def fileBacked(filepath: String)(using GitCommitter): IO[AlbumStore] = {
    JsonLoader
      .loadJsonFolder[PartialAlbum](filepath)
      .map(initialAlbums =>
        FilebackedAlbumStore(filepath, inMemory(initialAlbums))
      )
  }

}
