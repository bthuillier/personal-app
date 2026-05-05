package guitargear.guitar

import cats.effect.IO
import cats.effect.std.AtomicCell
import io.circe.syntax.*
import json.GitCommitter
import munit.CatsEffectSuite
import org.eclipse.jgit.api.Git
import org.typelevel.log4cats.slf4j.Slf4jLogger

import java.io.{File, PrintWriter}
import java.nio.file.{Files, Path}
import java.time.LocalDate
import scala.util.Using

class GuitarServiceTest extends CatsEffectSuite {
  private val tempRepo = FunFixture[Path](
    setup = { _ =>
      val dir = Files.createTempDirectory("guitar-service-test")
      Git.init().setDirectory(dir.toFile).call().close()
      dir
    },
    teardown = { dir =>
      def deleteRecursively(f: File): Unit = {
        if (f.isDirectory) Option(f.listFiles).toList.flatten.foreach(deleteRecursively)
        f.delete()
      }
      deleteRecursively(dir.toFile)
    }
  )

  private def sampleGuitar(id: String = "test-guitar-1"): Guitar =
    Guitar(
      id = id,
      model = "Test Model",
      brand = GuitarBrand.PRS,
      year = 2024,
      serialNumber = "SN-0001",
      specifications = GuitarSpecifications(
        bodyFinish = "Natural",
        top = None,
        bodyMaterial = GuitarMaterial.Mahogany,
        pickupConfiguration = PickupConfiguration(
          neckPickup = None,
          middlePickup = None,
          bridgePickup = Pickup(
            `type` = PickupType.Humbucker,
            brand = PickupBrand.SeymourDuncan,
            model = "JB"
          )
        ),
        fretboardMaterial = GuitarMaterial.Ebony,
        neckMaterial = List(GuitarMaterial.Maple),
        numberOfFrets = 24,
        scaleLengthInInches = 25.5,
        numberOfStrings = 6
      ),
      setup = GuitarSetup(
        stringGauge = List(10.0, 13.0, 17.0, 26.0, 36.0, 46.0),
        stringBrand = "D'Addario NYXL",
        tuning = GuitarTuning.sixStringTunings("Standard E"),
        lastStringChange = LocalDate.of(2024, 1, 1)
      ),
      description = Some("A test guitar"),
      events = None
    )

  private def writeGuitarJson(dir: Path, guitar: Guitar): String = {
    val file = dir.resolve(s"${guitar.id}.json").toFile
    Using.resource(new PrintWriter(file))(_.write(guitar.asJson.spaces2))
    file.getAbsolutePath
  }

  /** Builds a service seeded with the given guitars, using a real GitCommitter
    * pointed at a fresh temporary repo.
    */
  private def makeService(
      repoDir: Path,
      guitars: List[Guitar]
  ): IO[GuitarService] =
    for {
      gitCommitter <- GitCommitter.create(repoDir.toString)
      logger       <- Slf4jLogger.create[IO]
      stateMap = guitars.map { g =>
        val path = writeGuitarJson(repoDir, g)
        g.id -> (g, path)
      }.toMap
      cell <- AtomicCell[IO].of(stateMap)
    } yield {
      given GitCommitter = gitCommitter
      new GuitarService(cell, logger)
    }

  tempRepo.test("list returns all guitars in state") { repoDir =>
    val g1 = sampleGuitar("id-1")
    val g2 = sampleGuitar("id-2")
    for {
      service <- makeService(repoDir, List(g1, g2))
      result  <- service.list
    } yield {
      assertEquals(result.map(_.id).toSet, Set("id-1", "id-2"))
    }
  }

  tempRepo.test("list returns empty when no guitars present") { repoDir =>
    for {
      service <- makeService(repoDir, Nil)
      result  <- service.list
    } yield assertEquals(result, Nil)
  }

  tempRepo.test("find returns Some(guitar) for a known id") { repoDir =>
    val g = sampleGuitar("known-id")
    for {
      service <- makeService(repoDir, List(g))
      result  <- service.find("known-id")
    } yield assertEquals(result.map(_.id), Some("known-id"))
  }

  tempRepo.test("find returns None for an unknown id") { repoDir =>
    for {
      service <- makeService(repoDir, List(sampleGuitar()))
      result  <- service.find("does-not-exist")
    } yield assertEquals(result, None)
  }

  tempRepo.test("recommendStrings returns a recommendation per string") { repoDir =>
    val g = sampleGuitar()
    val targetTuning = GuitarTuning.sixStringTunings("D Standard")
    for {
      service <- makeService(repoDir, List(g))
      result  <- service.recommendStrings(g.id, targetTuning)
    } yield {
      assertEquals(result.length, g.setup.stringGauge.length)
    }
  }

  tempRepo.test("recommendStrings raises GuitarNotFoundException for unknown id") {
    repoDir =>
      val targetTuning = GuitarTuning.sixStringTunings("D Standard")
      for {
        service <- makeService(repoDir, Nil)
        err     <- service.recommendStrings("missing", targetTuning).attempt
      } yield assert(
        err.left.exists(_.isInstanceOf[GuitarNotFoundException]),
        s"expected GuitarNotFoundException, got: $err"
      )
  }

  tempRepo.test(
    "recommendStrings raises StringRecommendationException when target tuning size mismatches"
  ) { repoDir =>
    val g = sampleGuitar()
    val sevenString = GuitarTuning(
      g.setup.tuning.notes + Note(NoteName.B, 1)
    )
    for {
      service <- makeService(repoDir, List(g))
      err     <- service.recommendStrings(g.id, sevenString).attempt
    } yield assert(
      err.left.exists(_.isInstanceOf[StringRecommendationException]),
      s"expected StringRecommendationException, got: $err"
    )
  }

  tempRepo.test("handle ChangeStrings updates setup and appends event") { repoDir =>
    val g = sampleGuitar()
    val newTuning = GuitarTuning.sixStringTunings("Drop D")
    val command = GuitarCommand.ChangeStrings(
      date = LocalDate.of(2026, 1, 15),
      stringBrand = "Ernie Ball",
      stringGauge = List(11.0, 14.0, 18.0, 28.0, 38.0, 48.0),
      tuning = newTuning
    )
    for {
      service <- makeService(repoDir, List(g))
      result  <- service.handle(g.id, command)
      after   <- service.find(g.id)
    } yield {
      assertEquals(result.toOption.map(_.setup.stringBrand), Some("Ernie Ball"))
      assertEquals(result.toOption.map(_.setup.tuning), Some(newTuning))
      assertEquals(
        result.toOption.map(_.setup.lastStringChange),
        Some(command.dateOfEvent)
      )
      assertEquals(result.toOption.flatMap(_.events.map(_.length)), Some(1))
      assertEquals(after.flatMap(_.events.map(_.length)), Some(1))
    }
  }

  tempRepo.test("handle UpdateDescription sets the new description") { repoDir =>
    val g = sampleGuitar()
    val command =
      GuitarCommand.UpdateDescription(LocalDate.of(2026, 2, 1), "new desc")
    for {
      service <- makeService(repoDir, List(g))
      result  <- service.handle(g.id, command)
    } yield {
      assertEquals(result.toOption.flatMap(_.description), Some("new desc"))
    }
  }

  tempRepo.test("handle RemoveDescription clears the description") { repoDir =>
    val g = sampleGuitar()
    val command = GuitarCommand.RemoveDescription(LocalDate.of(2026, 2, 1))
    for {
      service <- makeService(repoDir, List(g))
      result  <- service.handle(g.id, command)
    } yield {
      assertEquals(result.toOption.flatMap(_.description), None)
    }
  }

  tempRepo.test("handle returns Left when guitar id is unknown") { repoDir =>
    val command = GuitarCommand.RemoveDescription(LocalDate.of(2026, 2, 1))
    for {
      service <- makeService(repoDir, Nil)
      result  <- service.handle("missing", command)
    } yield assert(result.isLeft, s"expected Left, got: $result")
  }

  tempRepo.test("handle persists the guitar JSON to disk") { repoDir =>
    val g = sampleGuitar()
    val command =
      GuitarCommand.UpdateDescription(LocalDate.of(2026, 2, 1), "persisted")
    for {
      service <- makeService(repoDir, List(g))
      _       <- service.handle(g.id, command)
      onDisk = scala.io.Source
        .fromFile(repoDir.resolve(s"${g.id}.json").toFile)
        .mkString
    } yield assert(
      onDisk.contains("persisted"),
      s"expected new description on disk, got: $onDisk"
    )
  }

  tempRepo.test("handle accumulates events across multiple commands") { repoDir =>
    val g = sampleGuitar()
    val cmd1 =
      GuitarCommand.UpdateDescription(LocalDate.of(2026, 2, 1), "v1")
    val cmd2 =
      GuitarCommand.UpdateDescription(LocalDate.of(2026, 2, 2), "v2")
    for {
      service <- makeService(repoDir, List(g))
      _       <- service.handle(g.id, cmd1)
      _       <- service.handle(g.id, cmd2)
      after   <- service.find(g.id)
    } yield {
      assertEquals(after.flatMap(_.events.map(_.length)), Some(2))
      assertEquals(after.flatMap(_.description), Some("v2"))
    }
  }
}
