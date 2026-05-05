package guitargear.amplifier

import json.{GitCommitter, JsonLoader}
import cats.effect.*
import cats.effect.std.AtomicCell
import io.circe.syntax.*
import java.io.{File, PrintWriter}
import scala.util.Using
import org.typelevel.log4cats.Logger
import org.typelevel.log4cats.slf4j.Slf4jLogger

class AmplifierService(
    cell: AtomicCell[IO, Map[String, (Amplifier, String)]],
    logger: Logger[IO]
)(using git: GitCommitter) {

  def list: IO[List[Amplifier]] =
    cell.get.map(_.values.map(_._1).toList)

  def find(id: String): IO[Option[Amplifier]] =
    cell.get.map(_.get(id).map(_._1))

  def handle(
      id: String,
      command: AmplifierCommand
  ): IO[Either[String, Amplifier]] =
    cell.evalModify { state =>
      state.get(id) match {
        case None => IO.pure(state -> Left(s"Amplifier $id not found"))
        case Some((amplifier, filePath)) =>
          val (event, updated) = amplifier.handle(command)
          val withEvent = updated.copy(events =
            Some(amplifier.events.getOrElse(List.empty) :+ event)
          )
          persistAmplifier(withEvent, filePath, command).map { _ =>
            state.updated(id, (withEvent, filePath)) -> Right(withEvent)
          }
      }
    }

  private def persistAmplifier(
      amplifier: Amplifier,
      filePath: String,
      command: AmplifierCommand
  ): IO[Unit] =
    IO.blocking {
      Using(new PrintWriter(new File(filePath))) { pw =>
        pw.write(amplifier.asJson.spaces2)
      }.get
    } *> git
      .commitFile(
        filePath,
        s"Update amplifier ${amplifier.id}: ${command.productPrefix}"
      )
      .handleErrorWith { e =>
        logger.warn(
          s"Git commit failed for $filePath — ${e.getMessage}"
        )
      }

}

object AmplifierService {
  def fromFile(basePath: String)(using GitCommitter): IO[AmplifierService] =
    for {
      logger <- Slf4jLogger.create[IO]
      entries <- JsonLoader
        .loadJsonFolderWithPaths[Amplifier](s"$basePath/guitar-amp")
      stateMap = entries.map { case (amplifier, path) =>
        amplifier.id -> (amplifier, path)
      }.toMap
      cell <- AtomicCell[IO].of(stateMap)
    } yield new AmplifierService(cell, logger)
}
