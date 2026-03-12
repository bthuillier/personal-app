package guitar

import utils.JsonLoader
import cats.effect.*
import cats.effect.std.AtomicCell
import io.circe.syntax.*
import java.io.{File, PrintWriter}
import scala.util.Using

class GuitarService(
    cell: AtomicCell[IO, Map[String, (Guitar, String)]]
) {

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
          persistGuitar(withEvent, filePath).map { _ =>
            state.updated(serial, (withEvent, filePath)) -> Right(withEvent)
          }
      }
    }

  private def persistGuitar(guitar: Guitar, filePath: String): IO[Unit] = IO {
    Using(new PrintWriter(new File(filePath))) { pw =>
      pw.write(guitar.asJson.spaces2)
    }.get
  }

}

object GuitarService {
  def fromFile(basePath: String): IO[GuitarService] =
    JsonLoader.loadJsonFolderWithPaths[Guitar](s"$basePath/guitar").flatMap { entries =>
      val stateMap = entries.map { case (guitar, path) =>
        guitar.serialNumber -> (guitar, path)
      }.toMap
      AtomicCell[IO].of(stateMap).map(new GuitarService(_))
    }
}
