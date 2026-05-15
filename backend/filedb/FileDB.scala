package filedb

import java.nio.file.Path
import io.circe.*
import io.circe.syntax.*
import io.circe.parser.decode
import cats.effect.kernel.{Async, Concurrent}
import cats.effect.std.Mutex
import cats.syntax.all.*
import fs2.io.file.{Files as FsFiles, Path as FsPath}

class FileTable[F[_]: Async: FsFiles, E: Encoder: Decoder] private (
    rootPath: Path,
    name: String,
    writeLock: Mutex[F]
) {

  def fullPath: Path = rootPath.resolve(name)

  private val fullFsPath: FsPath = FsPath.fromNioPath(fullPath)

  private def filePath(id: String): FsPath = fullFsPath / s"$id.json"

  private def readEntity(p: FsPath): F[E] =
    FsFiles[F].readUtf8(p).compile.string.flatMap { s =>
      Async[F].fromEither(decode[E](s)(using summon[Decoder[E]]))
    }

  private def writeEntity(p: FsPath, entity: E): F[Unit] =
    fs2.Stream
      .emit(entity.asJson(using summon[Encoder[E]]).spaces2)
      .through(FsFiles[F].writeUtf8(p))
      .compile
      .drain

  private def entities: fs2.Stream[F, E] =
    FsFiles[F]
      .list(fullFsPath)
      .evalFilter(FsFiles[F].isRegularFile(_))
      .filter(_.extName == ".json")
      .evalMap(readEntity)

  private def withLock[A](fa: F[A]): F[A] = writeLock.lock.surround(fa)

  def list: F[List[E]] = entities.compile.toList

  def get(id: String): F[E] = readEntity(filePath(id))

  def filter(f: E => Boolean): F[List[E]] = entities.filter(f).compile.toList

  def find(f: E => Boolean): F[Option[E]] = entities.find(f).compile.last

  def delete(id: String): F[Unit] = withLock(FsFiles[F].delete(filePath(id)))

  def update(id: String, updateF: E => E): F[Unit] =
    withLock(get(id).flatMap(e => writeEntity(filePath(id), updateF(e))))

  def update(id: String, entity: E): F[Unit] = update(id, _ => entity)

  def create(id: String, entity: E): F[Unit] = withLock(writeEntity(filePath(id), entity))

}

object FileTable {
  def apply[F[_]: Async: FsFiles, E: Encoder: Decoder](rootPath: Path, name: String): F[FileTable[F, E]] =
    Mutex[F].map(new FileTable[F, E](rootPath, name, _))
}

private def listSubdirectoryNames[F[_]: Concurrent: FsFiles](path: FsPath): F[List[String]] =
  FsFiles[F]
    .list(path)
    .evalFilter(FsFiles[F].isDirectory(_))
    .map(_.fileName.toString)
    .compile
    .toList

class FileDB[F[_]: Async: FsFiles](rootPath: Path, name: String) {
  private val dbPath: Path = rootPath.resolve(name)
  private val dbFsPath: FsPath = FsPath.fromNioPath(dbPath)

  def table[E: Encoder: Decoder](name: String): F[FileTable[F, E]] =
    FileTable[F, E](dbPath, name)

  def tables: F[List[String]] = listSubdirectoryNames(dbFsPath)
}

class FileDBEngine[F[_]: Async: FsFiles](rootPath: Path, dbRelativePath: Path) {

  private val fullPath: Path = rootPath.resolve(dbRelativePath)
  private val fullFsPath: FsPath = FsPath.fromNioPath(fullPath)

  def db(name: String): FileDB[F] =
    FileDB[F](fullPath, name)

  def dbs: F[List[String]] = listSubdirectoryNames(fullFsPath)

}
