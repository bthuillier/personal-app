package guitargear.amplifier

import cats.effect.IO
import filedb.FileDBEngine
import io.circe.syntax.*
import json.{GitCommitter, GitRepoFixture}
import munit.CatsEffectSuite

import java.io.PrintWriter
import java.nio.file.{Files, Path, Paths}
import java.time.LocalDate
import scala.util.Using

class AmplifierServiceTest extends CatsEffectSuite with GitRepoFixture {
  override protected def tempRepoPrefix: String = "amplifier-service-test"

  private def sampleAmplifier(id: String = "test-amp-1"): Amplifier =
    Amplifier(
      id = id,
      model = "Test Amp",
      serialNumber = "SN-0001",
      brand = AmplifierBrand.Victory,
      year = 2024,
      wattage = 50,
      `type` = AmpType.Tube,
      description = Some("A test amplifier"),
      events = None
    )

  private def seedAmplifier(tableDir: Path, amplifier: Amplifier): Unit = {
    Files.createDirectories(tableDir)
    val file = tableDir.resolve(s"${amplifier.id}.json").toFile
    Using.resource(new PrintWriter(file))(_.write(amplifier.asJson.spaces2))
  }

  private def makeService(
      repoDir: Path,
      amplifiers: List[Amplifier]
  ): IO[AmplifierService] = {
    val tableDir = repoDir.resolve("guitar-gear").resolve("guitar-amp")
    amplifiers.foreach(seedAmplifier(tableDir, _))
    for {
      gitCommitter <- GitCommitter.create(repoDir.toString)
      engine <- FileDBEngine[IO](repoDir, Paths.get("."))
      db <- engine.db("guitar-gear")
      service <- {
        given GitCommitter = gitCommitter
        AmplifierService.fromDB(db)
      }
    } yield service
  }

  tempRepo.test("list returns all amplifiers in state") { repoDir =>
    val a1 = sampleAmplifier("id-1")
    val a2 = sampleAmplifier("id-2")
    for {
      service <- makeService(repoDir, List(a1, a2))
      result <- service.list
    } yield assertEquals(result.map(_.id).toSet, Set("id-1", "id-2"))
  }

  tempRepo.test("list returns empty when no amplifiers present") { repoDir =>
    for {
      service <- makeService(repoDir, Nil)
      result <- service.list
    } yield assertEquals(result, Nil)
  }

  tempRepo.test("find returns Some(amplifier) for a known id") { repoDir =>
    val a = sampleAmplifier("known-id")
    for {
      service <- makeService(repoDir, List(a))
      result <- service.find("known-id")
    } yield assertEquals(result.map(_.id), Some("known-id"))
  }

  tempRepo.test("find returns None for an unknown id") { repoDir =>
    for {
      service <- makeService(repoDir, List(sampleAmplifier()))
      result <- service.find("does-not-exist")
    } yield assertEquals(result, None)
  }

  tempRepo.test("handle UpdateDescription sets the new description") { repoDir =>
    val a = sampleAmplifier()
    val command =
      AmplifierCommand.UpdateDescription(LocalDate.of(2026, 2, 1), "new desc")
    for {
      service <- makeService(repoDir, List(a))
      result <- service.handle(a.id, command)
    } yield assertEquals(result.toOption.flatMap(_.description), Some("new desc"))
  }

  tempRepo.test("handle RemoveDescription clears the description") { repoDir =>
    val a = sampleAmplifier()
    val command = AmplifierCommand.RemoveDescription(LocalDate.of(2026, 2, 1))
    for {
      service <- makeService(repoDir, List(a))
      result <- service.handle(a.id, command)
    } yield assertEquals(result.toOption.flatMap(_.description), None)
  }

  tempRepo.test("handle returns Left when amplifier id is unknown") { repoDir =>
    val command = AmplifierCommand.RemoveDescription(LocalDate.of(2026, 2, 1))
    for {
      service <- makeService(repoDir, Nil)
      result <- service.handle("missing", command)
    } yield assert(result.isLeft, s"expected Left, got: $result")
  }

  tempRepo.test("handle persists the amplifier JSON to disk") { repoDir =>
    val a = sampleAmplifier()
    val command =
      AmplifierCommand.UpdateDescription(LocalDate.of(2026, 2, 1), "persisted")
    val expectedFile =
      repoDir.resolve("guitar-gear").resolve("guitar-amp").resolve(s"${a.id}.json")
    for {
      service <- makeService(repoDir, List(a))
      _ <- service.handle(a.id, command)
      onDisk = scala.io.Source.fromFile(expectedFile.toFile).mkString
    } yield assert(
      onDisk.contains("persisted"),
      s"expected new description on disk, got: $onDisk"
    )
  }

  tempRepo.test("handle accumulates events across multiple commands") { repoDir =>
    val a = sampleAmplifier()
    val cmd1 =
      AmplifierCommand.UpdateDescription(LocalDate.of(2026, 2, 1), "v1")
    val cmd2 =
      AmplifierCommand.UpdateDescription(LocalDate.of(2026, 2, 2), "v2")
    for {
      service <- makeService(repoDir, List(a))
      _ <- service.handle(a.id, cmd1)
      _ <- service.handle(a.id, cmd2)
      after <- service.find(a.id)
    } yield {
      assertEquals(after.flatMap(_.events.map(_.length)), Some(2))
      assertEquals(after.flatMap(_.description), Some("v2"))
    }
  }
}
