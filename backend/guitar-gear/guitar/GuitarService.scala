package guitargear.guitar

import json.{JsonLoader, GitCommitter}
import cats.effect.*
import cats.effect.std.AtomicCell
import io.circe.syntax.*
import java.io.{File, PrintWriter}
import scala.util.Using
import org.typelevel.log4cats.Logger
import org.typelevel.log4cats.slf4j.Slf4jLogger

class GuitarService(
    cell: AtomicCell[IO, Map[String, (Guitar, String)]],
    logger: Logger[IO]
)(using git: GitCommitter) {

  def list: IO[List[Guitar]] =
    cell.get.map(_.values.map(_._1).toList)

  def find(serial: String): IO[Option[Guitar]] =
    cell.get.map(_.get(serial).map(_._1))

  def handle(serial: String, command: GuitarCommand): IO[Either[String, Guitar]] =
    cell.evalModify { state =>
      state.get(serial) match {
        case None => IO.pure(state -> Left(s"Guitar $serial not found"))
        case Some((guitar, filePath)) =>
          val (event, updated) = guitar.handle(command)
          val withEvent = updated.copy(events = Some(guitar.events.getOrElse(List.empty) :+ event))
          persistGuitar(withEvent, filePath, command).map { _ =>
            state.updated(serial, (withEvent, filePath)) -> Right(withEvent)
          }
      }
    }

  private def persistGuitar(guitar: Guitar, filePath: String, command: GuitarCommand): IO[Unit] =
    IO.blocking {
      Using(new PrintWriter(new File(filePath))) { pw =>
        pw.write(guitar.asJson.spaces2)
      }.get
    } *> git
      .commitFile(
        filePath,
        s"Update guitar ${guitar.serialNumber}: ${command.productPrefix}"
      )
      .handleErrorWith { e =>
        logger.warn(
          s"Git commit failed for $filePath — ${e.getMessage}"
        )
      }

}

object GuitarService {
  def fromFile(basePath: String)(using GitCommitter): IO[GuitarService] =
    for {
      logger <- Slf4jLogger.create[IO]
      entries <- JsonLoader.loadJsonFolderWithPaths[Guitar](s"$basePath/guitar")
      stateMap = entries.map { case (guitar, path) =>
        guitar.serialNumber -> (guitar, path)
      }.toMap
      cell <- AtomicCell[IO].of(stateMap)
    } yield new GuitarService(cell, logger)
}
