package guitargear.pedal

import cats.effect.IO
import cats.effect.std.AtomicCell
import io.circe.syntax.*
import json.{GitCommitter, GitRepoFixture}
import munit.CatsEffectSuite
import org.typelevel.log4cats.slf4j.Slf4jLogger

import java.io.PrintWriter
import java.nio.file.Path
import java.time.LocalDate
import scala.util.Using

class GuitarPedalServiceTest extends CatsEffectSuite with GitRepoFixture {
  override protected def tempRepoPrefix: String = "guitar-pedal-service-test"

  private def samplePedal(id: String = "test-pedal-1"): GuitarPedal =
    GuitarPedal(
      id = id,
      model = "Test Pedal",
      serialNumber = "SN-0001",
      brand = GuitarPedalBrand.Boss,
      year = 2024,
      `type` = PedalType.Distortion,
      description = Some("A test pedal"),
      events = None
    )

  private def writePedalJson(dir: Path, pedal: GuitarPedal): String = {
    val file = dir.resolve(s"${pedal.id}.json").toFile
    Using.resource(new PrintWriter(file))(_.write(pedal.asJson.spaces2))
    file.getAbsolutePath
  }

  private def makeService(
      repoDir: Path,
      pedals: List[GuitarPedal]
  ): IO[GuitarPedalService] =
    for {
      gitCommitter <- GitCommitter.create(repoDir.toString)
      logger <- Slf4jLogger.create[IO]
      stateMap = pedals.map { p =>
        val path = writePedalJson(repoDir, p)
        p.id -> (p, path)
      }.toMap
      cell <- AtomicCell[IO].of(stateMap)
    } yield {
      given GitCommitter = gitCommitter
      new GuitarPedalService(cell, logger)
    }

  tempRepo.test("list returns all pedals in state") { repoDir =>
    val p1 = samplePedal("id-1")
    val p2 = samplePedal("id-2")
    for {
      service <- makeService(repoDir, List(p1, p2))
      result <- service.list
    } yield assertEquals(result.map(_.id).toSet, Set("id-1", "id-2"))
  }

  tempRepo.test("list returns empty when no pedals present") { repoDir =>
    for {
      service <- makeService(repoDir, Nil)
      result <- service.list
    } yield assertEquals(result, Nil)
  }

  tempRepo.test("find returns Some(pedal) for a known id") { repoDir =>
    val p = samplePedal("known-id")
    for {
      service <- makeService(repoDir, List(p))
      result <- service.find("known-id")
    } yield assertEquals(result.map(_.id), Some("known-id"))
  }

  tempRepo.test("find returns None for an unknown id") { repoDir =>
    for {
      service <- makeService(repoDir, List(samplePedal()))
      result <- service.find("does-not-exist")
    } yield assertEquals(result, None)
  }

  tempRepo.test("handle UpdateDescription sets the new description") { repoDir =>
    val p = samplePedal()
    val command =
      GuitarPedalCommand.UpdateDescription(LocalDate.of(2026, 2, 1), "new desc")
    for {
      service <- makeService(repoDir, List(p))
      result <- service.handle(p.id, command)
    } yield assertEquals(result.toOption.flatMap(_.description), Some("new desc"))
  }

  tempRepo.test("handle RemoveDescription clears the description") { repoDir =>
    val p = samplePedal()
    val command = GuitarPedalCommand.RemoveDescription(LocalDate.of(2026, 2, 1))
    for {
      service <- makeService(repoDir, List(p))
      result <- service.handle(p.id, command)
    } yield assertEquals(result.toOption.flatMap(_.description), None)
  }

  tempRepo.test("handle returns Left when pedal id is unknown") { repoDir =>
    val command = GuitarPedalCommand.RemoveDescription(LocalDate.of(2026, 2, 1))
    for {
      service <- makeService(repoDir, Nil)
      result <- service.handle("missing", command)
    } yield assert(result.isLeft, s"expected Left, got: $result")
  }

  tempRepo.test("handle persists the pedal JSON to disk") { repoDir =>
    val p = samplePedal()
    val command =
      GuitarPedalCommand.UpdateDescription(LocalDate.of(2026, 2, 1), "persisted")
    for {
      service <- makeService(repoDir, List(p))
      _ <- service.handle(p.id, command)
      onDisk = scala.io.Source
        .fromFile(repoDir.resolve(s"${p.id}.json").toFile)
        .mkString
    } yield assert(
      onDisk.contains("persisted"),
      s"expected new description on disk, got: $onDisk"
    )
  }

  tempRepo.test("handle accumulates events across multiple commands") { repoDir =>
    val p = samplePedal()
    val cmd1 =
      GuitarPedalCommand.UpdateDescription(LocalDate.of(2026, 2, 1), "v1")
    val cmd2 =
      GuitarPedalCommand.UpdateDescription(LocalDate.of(2026, 2, 2), "v2")
    for {
      service <- makeService(repoDir, List(p))
      _ <- service.handle(p.id, cmd1)
      _ <- service.handle(p.id, cmd2)
      after <- service.find(p.id)
    } yield {
      assertEquals(after.flatMap(_.events.map(_.length)), Some(2))
      assertEquals(after.flatMap(_.description), Some("v2"))
    }
  }
}
