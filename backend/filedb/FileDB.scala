package filedb

import java.nio.file.Path
import io.circe.*
import io.circe.syntax.*
import io.circe.parser.decode
import cats.effect.kernel.{Async, Concurrent}
import cats.effect.std.Mutex
import cats.syntax.all.*
import fs2.io.file.{Files as FsFiles, Flag, Flags, Path as FsPath}
import java.nio.charset.StandardCharsets

class FileTable[F[_]: Async: FsFiles, E: Encoder: Decoder] private (
    val name: String,
    fullFsPath: FsPath,
    writeLock: Mutex[F]
) {

  private def filePath(id: String): FsPath = fullFsPath / s"$id.json"

  private def readEntity(p: FsPath): F[E] =
    FsFiles[F].readUtf8(p).compile.string.flatMap { s =>
      Async[F].fromEither(decode[E](s)(using summon[Decoder[E]]))
    }

  private def writeEntity(p: FsPath, entity: E, flags: Flags): F[Unit] =
    fs2.Stream
      .chunk(fs2.Chunk.array(entity.asJson(using summon[Encoder[E]]).spaces2.getBytes(StandardCharsets.UTF_8)))
      .through(FsFiles[F].writeAll(p, flags))
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

  def delete(id: String): F[Path] =
    val p = filePath(id)
    withLock(FsFiles[F].delete(p)).as(p.toNioPath)

  def update(id: String, updateF: E => E): F[Path] =
    val p = filePath(id)
    withLock(get(id).flatMap(e => writeEntity(p, updateF(e), Flags.Write))).as(p.toNioPath)

  def update(id: String, entity: E): F[Path] = update(id, _ => entity)

  def create(id: String, entity: E): F[Path] =
    val p = filePath(id)
    withLock(writeEntity(p, entity, Flags(Flag.Write, Flag.CreateNew))).as(p.toNioPath)

}

object FileTable {
  def apply[F[_]: Async: FsFiles, E: Encoder: Decoder](parentPath: FsPath, name: String): F[FileTable[F, E]] =
    val tablePath = parentPath / name
    FsFiles[F].createDirectories(tablePath) *>
      Mutex[F].map(new FileTable[F, E](name, tablePath, _))
}

private def listSubdirectoryNames[F[_]: Concurrent: FsFiles](path: FsPath): F[List[String]] =
  FsFiles[F]
    .list(path)
    .evalFilter(FsFiles[F].isDirectory(_))
    .map(_.fileName.toString)
    .compile
    .toList

class FileDB[F[_]: Async: FsFiles] private (val name: String, dbFsPath: FsPath) {

  def table[E: Encoder: Decoder](name: String): F[FileTable[F, E]] =
    FileTable[F, E](dbFsPath, name)

  def tables: F[List[String]] = listSubdirectoryNames(dbFsPath)
}

object FileDB {
  def apply[F[_]: Async: FsFiles](parentPath: FsPath, name: String): F[FileDB[F]] =
    val dbPath = parentPath / name
    FsFiles[F].createDirectories(dbPath).as(new FileDB[F](name, dbPath))
}

class FileDBEngine[F[_]: Async: FsFiles] private (fullFsPath: FsPath) {

  def db(name: String): F[FileDB[F]] =
    FileDB[F](fullFsPath, name)

  def dbs: F[List[String]] = listSubdirectoryNames(fullFsPath)

}

object FileDBEngine {
  def apply[F[_]: Async: FsFiles](rootPath: Path, dbRelativePath: Path): F[FileDBEngine[F]] =
    val enginePath = FsPath.fromNioPath(rootPath.resolve(dbRelativePath))
    FsFiles[F].createDirectories(enginePath).as(new FileDBEngine[F](enginePath))
}
