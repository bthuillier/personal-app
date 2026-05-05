package guitargear.pedal

import json.{GitCommitter, JsonLoader}
import cats.effect.*
import cats.effect.std.AtomicCell
import io.circe.syntax.*
import java.io.{File, PrintWriter}
import scala.util.Using
import org.typelevel.log4cats.Logger
import org.typelevel.log4cats.slf4j.Slf4jLogger

class GuitarPedalService(
    cell: AtomicCell[IO, Map[String, (GuitarPedal, String)]],
    logger: Logger[IO]
)(using git: GitCommitter) {

  def list: IO[List[GuitarPedal]] =
    cell.get.map(_.values.map(_._1).toList)

  def find(id: String): IO[Option[GuitarPedal]] =
    cell.get.map(_.get(id).map(_._1))

  def handle(
      id: String,
      command: GuitarPedalCommand
  ): IO[Either[String, GuitarPedal]] =
    cell.evalModify { state =>
      state.get(id) match {
        case None => IO.pure(state -> Left(s"Guitar pedal $id not found"))
        case Some((pedal, filePath)) =>
          val (event, updated) = pedal.handle(command)
          val withEvent = updated.copy(events =
            Some(pedal.events.getOrElse(List.empty) :+ event)
          )
          persistPedal(withEvent, filePath, command).map { _ =>
            state.updated(id, (withEvent, filePath)) -> Right(withEvent)
          }
      }
    }

  private def persistPedal(
      pedal: GuitarPedal,
      filePath: String,
      command: GuitarPedalCommand
  ): IO[Unit] =
    IO.blocking {
      Using(new PrintWriter(new File(filePath))) { pw =>
        pw.write(pedal.asJson.spaces2)
      }.get
    } *> git
      .commitFile(
        filePath,
        s"Update guitar pedal ${pedal.id}: ${command.productPrefix}"
      )
      .handleErrorWith { e =>
        logger.warn(
          s"Git commit failed for $filePath — ${e.getMessage}"
        )
      }

}

object GuitarPedalService {
  def fromFile(basePath: String)(using GitCommitter): IO[GuitarPedalService] =
    for {
      logger <- Slf4jLogger.create[IO]
      entries <- JsonLoader
        .loadJsonFolderWithPaths[GuitarPedal](s"$basePath/guitar-pedal")
      stateMap = entries.map { case (pedal, path) =>
        pedal.id -> (pedal, path)
      }.toMap
      cell <- AtomicCell[IO].of(stateMap)
    } yield new GuitarPedalService(cell, logger)
}
