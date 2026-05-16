package guitargear.amplifier

import json.GitCommitter
import filedb.{FileDB, FileTable}
import cats.effect.*
import cats.effect.std.AtomicCell
import org.typelevel.log4cats.Logger
import org.typelevel.log4cats.slf4j.Slf4jLogger

class AmplifierService(
    table: FileTable[IO, Amplifier],
    cache: AtomicCell[IO, Map[String, Amplifier]],
    logger: Logger[IO]
)(using git: GitCommitter) {

  def list: IO[List[Amplifier]] =
    cache.get.map(_.values.toList)

  def find(id: String): IO[Option[Amplifier]] =
    cache.get.map(_.get(id))

  def handle(
      id: String,
      command: AmplifierCommand
  ): IO[Either[String, Amplifier]] =
    cache.evalModify { state =>
      state.get(id) match {
        case None => IO.pure(state -> Left(s"Amplifier $id not found"))
        case Some(amplifier) =>
          val (event, updated) = amplifier.handle(command)
          val withEvent = updated.copy(events =
            Some(amplifier.events.getOrElse(List.empty) :+ event)
          )
          persist(withEvent, command).as(
            state.updated(id, withEvent) -> Right(withEvent)
          )
      }
    }

  private def persist(
      amplifier: Amplifier,
      command: AmplifierCommand
  ): IO[Unit] =
    table.update(amplifier.id, amplifier).flatMap { path =>
      git
        .commitFile(
          path.toString,
          s"Update amplifier ${amplifier.id}: ${command.productPrefix}"
        )
        .handleErrorWith { e =>
          logger.warn(s"Git commit failed for $path — ${e.getMessage}")
        }
    }

}

object AmplifierService {
  def fromDB(db: FileDB[IO])(using GitCommitter): IO[AmplifierService] =
    for {
      logger <- Slf4jLogger.create[IO]
      table <- db.table[Amplifier]("guitar-amp")
      entries <- table.list
      cache <- AtomicCell[IO].of(entries.map(a => a.id -> a).toMap)
    } yield new AmplifierService(table, cache, logger)
}
