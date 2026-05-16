package guitargear.guitar

import json.GitCommitter
import filedb.{FileDB, FileTable}
import cats.effect.*
import cats.effect.std.AtomicCell
import guitargear.strings.{NyxlCatalog, Recommender, StringRecommendation}
import org.typelevel.log4cats.Logger
import org.typelevel.log4cats.slf4j.Slf4jLogger

class GuitarService(
    table: FileTable[IO, Guitar],
    cache: AtomicCell[IO, Map[String, Guitar]],
    logger: Logger[IO]
)(using git: GitCommitter) {

  def list: IO[List[Guitar]] =
    cache.get.map(_.values.toList)

  def find(id: String): IO[Option[Guitar]] =
    cache.get.map(_.get(id))

  def recommendStrings(
      id: String,
      targetTuning: GuitarTuning
  ): IO[List[StringRecommendation]] =
    find(id).flatMap {
      case None => IO.raiseError(Errors.guitarNotFound(id))
      case Some(guitar) =>
        Recommender.recommend(
          referenceGauges = guitar.setup.stringGauge,
          referenceTuning = guitar.setup.tuning.notes.toList,
          targetTuning = targetTuning.notes.toList,
          scaleLengthInches = guitar.specifications.scaleLengthInInches,
          catalog = NyxlCatalog
        ) match {
          case Right(result) => IO.pure(result)
          case Left(message) =>
            IO.raiseError(Errors.stringRecommendationFailure(message))
        }
    }

  def handle(id: String, command: GuitarCommand): IO[Either[String, Guitar]] =
    cache.evalModify { state =>
      state.get(id) match {
        case None => IO.pure(state -> Left(s"Guitar $id not found"))
        case Some(guitar) =>
          val (event, updated) = guitar.handle(command)
          val withEvent = updated.copy(events =
            Some(guitar.events.getOrElse(List.empty) :+ event)
          )
          persist(withEvent, command).as(
            state.updated(id, withEvent) -> Right(withEvent)
          )
      }
    }

  private def persist(
      guitar: Guitar,
      command: GuitarCommand
  ): IO[Unit] =
    table.update(guitar.id, guitar).flatMap { path =>
      git
        .commitFile(
          path.toString,
          s"Update guitar ${guitar.id}: ${command.productPrefix}"
        )
        .handleErrorWith { e =>
          logger.warn(s"Git commit failed for $path — ${e.getMessage}")
        }
    }

}

object GuitarService {
  def fromDB(db: FileDB[IO])(using GitCommitter): IO[GuitarService] =
    for {
      logger <- Slf4jLogger.create[IO]
      table <- db.table[Guitar]("guitar")
      entries <- table.list
      cache <- AtomicCell[IO].of(entries.map(g => g.id -> g).toMap)
    } yield new GuitarService(table, cache, logger)
}
