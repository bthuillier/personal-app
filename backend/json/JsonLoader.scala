package json

import io.circe.{Decoder, Encoder}
import io.circe.syntax.*
import io.circe.parser.decode
import scala.io.Source
import scala.util.Using
import java.io.File
import cats.effect.IO
import cats.effect.unsafe.IORuntime
import cats.syntax.all.*

object JsonLoader {

  def saveJsonFile[A: Encoder](filePath: String, data: A): IO[Unit] = {
    val jsonString = data.asJson.spaces2

    IO.blocking {
      val pw = new java.io.PrintWriter(new File(filePath))
      try pw.write(jsonString)
      finally pw.close()
    }
  }

  def loadJsonFile[A: Decoder](filePath: String): IO[A] = {
    val fileContentResult = Using(Source.fromFile(filePath)) { source =>
      source.mkString
    }

    IO.fromTry(fileContentResult).flatMap { content =>
      IO.fromEither(decode[A](content))
    }
  }

  def loadJsonFileUnsafe[A: Decoder](filePath: String)(using IORuntime): A = {
    loadJsonFile[A](filePath).unsafeRunSync()
  }

  def loadJsonFolder[A: Decoder](folderPath: String): IO[List[A]] = {
    val folder = new File(folderPath)

    val exists = IO.raiseWhen(!folder.exists())(
      new RuntimeException(s"Folder does not exist: $folderPath")
    )
    val isDirectory = IO.raiseWhen(!folder.isDirectory())(
      new RuntimeException(s"Path is not a directory: $folderPath")
    )

    (exists *> isDirectory).flatMap { _ =>
      val jsonFiles = folder.listFiles().filter { file =>
        file.isFile && file.getName.toLowerCase.endsWith(".json")
      }

      if (jsonFiles.isEmpty) {
        IO.pure(List.empty[A])
      } else {
        jsonFiles.toList.traverse { file =>
          loadJsonFile[A](file.getAbsolutePath)
        }
      }
    }
  }

  def loadJsonFolderUnsafe[A: Decoder](
      folderPath: String
  )(using IORuntime): List[A] = {
    loadJsonFolder[A](folderPath).unsafeRunSync()
  }

  def loadJsonFolderWithPaths[A: Decoder](folderPath: String): IO[List[(A, String)]] = {
    val folder = new File(folderPath)

    val exists = IO.raiseWhen(!folder.exists())(
      new RuntimeException(s"Folder does not exist: $folderPath")
    )
    val isDirectory = IO.raiseWhen(!folder.isDirectory())(
      new RuntimeException(s"Path is not a directory: $folderPath")
    )

    (exists *> isDirectory).flatMap { _ =>
      val jsonFiles = folder.listFiles().filter { file =>
        file.isFile && file.getName.toLowerCase.endsWith(".json")
      }

      if (jsonFiles.isEmpty) {
        IO.pure(List.empty)
      } else {
        jsonFiles.toList.traverse { file =>
          loadJsonFile[A](file.getAbsolutePath).map(_ -> file.getAbsolutePath)
        }
      }
    }
  }
}
