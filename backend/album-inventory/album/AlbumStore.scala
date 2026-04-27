package album

import cats.effect.*
import scala.collection.mutable
import json.{JsonLoader, GitCommitter}

trait AlbumStore {
  def list: IO[List[PartialAlbum]]
  def add(partialAlbum: PartialAlbum): IO[Unit]
  def addGenre(albumId: String, genre: String): IO[Unit]
  def removeGenre(albumId: String, genre: String): IO[Unit]
  def setReview(albumId: String, review: Review): IO[Unit]
  def getById(albumId: String): IO[Option[PartialAlbum]]
}

object AlbumStore {
  private class InMemoryAlbumStore(initialState: List[PartialAlbum])
      extends AlbumStore {

    override def removeGenre(albumId: String, genre: String): IO[Unit] =
      IO.fromOption(albums.get(albumId))(
        Errors.albumNotFound(albumId)
      ).map(_.removeGenre(genre))
        .flatMap(updatedAlbum => add(updatedAlbum))

    override def list: IO[List[PartialAlbum]] = IO(albums.values.toList)

    override def add(partialAlbum: PartialAlbum): IO[Unit] = IO {
      albums.update(partialAlbum.id, partialAlbum)
    }

    override def addGenre(albumId: String, genre: String): IO[Unit] =
      IO.fromOption(albums.get(albumId))(
        Errors.albumNotFound(albumId)
      ).map(_.addGenre(genre))
        .flatMap(updatedAlbum => add(updatedAlbum))

    override def setReview(albumId: String, review: Review): IO[Unit] =
      IO.fromOption(albums.get(albumId))(
        Errors.albumNotFound(albumId)
      ).map(_.setReview(review))
        .flatMap(updatedAlbum => add(updatedAlbum))

    override def getById(albumId: String): IO[Option[PartialAlbum]] = IO {
      albums.get(albumId)
    }

    private val albums: mutable.Map[String, PartialAlbum] =
      mutable.Map.from(
        initialState.map(album => album.id -> album)
      )

  }

  private class FilebackedAlbumStore(
      filepath: String,
      internalStore: AlbumStore
  )(using GitCommitter)
      extends AlbumStore {

    override def removeGenre(albumId: String, genre: String): IO[Unit] =
      internalStore.getById(albumId).flatMap {
        case Some(album) =>
          val updatedAlbum = album.removeGenre(genre)
          internalStore.add(updatedAlbum) *>
            saveAlbum(
              updatedAlbum,
              s"Remove genre '$genre' from album '${album.name}'"
            )
        case None => IO.unit
      }

    private def saveAlbum(partialAlbum: PartialAlbum, msg: String): IO[Unit] =
      JsonLoader.saveJsonFileAndCommit(
        s"$filepath/${partialAlbum.id}.json",
        partialAlbum,
        msg
      )

    override def list: IO[List[PartialAlbum]] = internalStore.list

    override def add(partialAlbum: PartialAlbum): IO[Unit] =
      internalStore.add(partialAlbum) *>
        saveAlbum(
          partialAlbum,
          s"Add album: ${partialAlbum.name} by ${partialAlbum.artist}"
        )

    override def addGenre(albumId: String, genre: String): IO[Unit] =
      internalStore.addGenre(albumId, genre) *>
        internalStore.getById(albumId).flatMap {
          case Some(album) =>
            saveAlbum(album, s"Add genre '$genre' to album '${album.name}'")
          case None => IO.unit
        }

    override def setReview(albumId: String, review: Review): IO[Unit] =
      internalStore.setReview(albumId, review) *>
        internalStore.getById(albumId).flatMap {
          case Some(album) =>
            saveAlbum(
              album,
              s"Set review (rating ${review.rating}) on album '${album.name}'"
            )
          case None => IO.unit
        }

    override def getById(albumId: String): IO[Option[PartialAlbum]] =
      internalStore.getById(albumId)

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
