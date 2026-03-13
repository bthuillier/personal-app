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
      albums.update(
        (partialAlbum.name, partialAlbum.artist, partialAlbum.format),
        partialAlbum
      )
    }

    private val albums
        : mutable.Map[(String, String, AlbumFormat), PartialAlbum] =
      mutable.Map.from(
        initialState.map(album =>
          (album.name, album.artist, album.format) -> album
        )
      )

  }

  private class FilebackedAlbumStore(
      filepath: String,
      internalStore: AlbumStore
  )(using GitCommitter) extends AlbumStore {

    override def list: IO[List[PartialAlbum]] = internalStore.list

    override def add(partialAlbum: PartialAlbum): IO[Unit] =
      internalStore.add(partialAlbum) *>
        internalStore.list
          .map(_.filter(_.index == partialAlbum.index))
          .flatMap { albumsForIndex =>
            JsonLoader.saveJsonFileAndCommit(
              s"$filepath/${partialAlbum.index}.json",
              albumsForIndex,
              s"Add album: ${partialAlbum.name} by ${partialAlbum.artist}"
            )
          }
  }

  def inMemory(initialState: List[PartialAlbum] = List.empty): AlbumStore =
    InMemoryAlbumStore(initialState)

  def fileBacked(filepath: String)(using GitCommitter): IO[AlbumStore] = {
    JsonLoader
      .loadJsonFolder[List[PartialAlbum]](filepath)
      .map(initialAlbums =>
        FilebackedAlbumStore(filepath, inMemory(initialAlbums.flatten))
      )
  }

}
