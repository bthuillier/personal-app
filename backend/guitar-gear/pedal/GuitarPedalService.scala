package guitargear.pedal

import json.GitCommitter
import filedb.{FileDB, FileTable}
import cats.effect.*
import cats.effect.std.AtomicCell
import org.typelevel.log4cats.Logger
import org.typelevel.log4cats.slf4j.Slf4jLogger

class GuitarPedalService(
    table: FileTable[IO, GuitarPedal],
    cache: AtomicCell[IO, Map[String, GuitarPedal]],
    logger: Logger[IO]
)(using git: GitCommitter) {

  def list: IO[List[GuitarPedal]] =
    cache.get.map(_.values.toList)

  def find(id: String): IO[Option[GuitarPedal]] =
    cache.get.map(_.get(id))

  def handle(
      id: String,
      command: GuitarPedalCommand
  ): IO[Either[String, GuitarPedal]] =
    cache.evalModify { state =>
      state.get(id) match {
        case None => IO.pure(state -> Left(s"Guitar pedal $id not found"))
        case Some(pedal) =>
          val (event, updated) = pedal.handle(command)
          val withEvent = updated.copy(events =
            Some(pedal.events.getOrElse(List.empty) :+ event)
          )
          persist(withEvent, command).as(
            state.updated(id, withEvent) -> Right(withEvent)
          )
      }
    }

  private def persist(
      pedal: GuitarPedal,
      command: GuitarPedalCommand
  ): IO[Unit] =
    table.update(pedal.id, pedal).flatMap { path =>
      git
        .commitFile(
          path.toString,
          s"Update guitar pedal ${pedal.id}: ${command.productPrefix}"
        )
        .handleErrorWith { e =>
          logger.warn(s"Git commit failed for $path — ${e.getMessage}")
        }
    }

}

object GuitarPedalService {
  def fromDB(db: FileDB[IO])(using GitCommitter): IO[GuitarPedalService] =
    for {
      logger <- Slf4jLogger.create[IO]
      table <- db.table[GuitarPedal]("guitar-pedal")
      entries <- table.list
      cache <- AtomicCell[IO].of(entries.map(p => p.id -> p).toMap)
    } yield new GuitarPedalService(table, cache, logger)
}
