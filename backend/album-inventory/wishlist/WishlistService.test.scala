package wishlist

import cats.effect.IO
import album.AlbumFormat
import java.time.LocalDate
import eventbus.EventBus
import filedb.FileDBEngine
import json.{GitCommitter, GitRepoFixture}
import munit.CatsEffectSuite
import utils.GenerateId

import java.nio.file.{Path, Paths}

class WishlistServiceTest extends CatsEffectSuite with GitRepoFixture {
  override protected def tempRepoPrefix: String = "wishlist-service-test"

  private def createService(
      repoDir: Path,
      eventBus: EventBus[WishlistAlbum]
  ): IO[WishlistService] =
    for {
      gitCommitter <- GitCommitter.create(repoDir.toString)
      engine <- FileDBEngine[IO](repoDir, Paths.get("."))
      db <- engine.db("music-inventory")
      service <- {
        given GitCommitter = gitCommitter
        WishlistService.fileBacked(db, eventBus)
      }
    } yield service

  private def createService(repoDir: Path): IO[WishlistService] =
    EventBus.create[WishlistAlbum].flatMap(createService(repoDir, _))

  val sampleAlbum = WishlistService.AddAlbumToWishlist(
    name = "Dark Side of the Moon",
    artist = "Pink Floyd",
    format = AlbumFormat.Vinyl,
    releaseDate = LocalDate.of(1973, 3, 1),
    status = WishlistStatus.Wanted
  )

  val sampleAlbumId = GenerateId.makeId("Dark Side of the Moon", "Pink Floyd")()

  val anotherAlbum = WishlistService.AddAlbumToWishlist(
    name = "Abbey Road",
    artist = "The Beatles",
    format = AlbumFormat.CD,
    releaseDate = LocalDate.of(1969, 9, 26),
    status = WishlistStatus.Wanted
  )

  val anotherAlbumId = GenerateId.makeId("Abbey Road", "The Beatles")()

  tempRepo.test("list returns empty list initially") { repoDir =>
    for {
      service <- createService(repoDir)
      albums <- service.list
    } yield assertEquals(albums, List.empty[WishlistAlbum])
  }

  tempRepo.test("addAlbumToWishlist adds an album to the wishlist") { repoDir =>
    for {
      service <- createService(repoDir)
      _ <- service.addAlbumToWishlist(sampleAlbum)
      albums <- service.list
    } yield {
      assertEquals(albums.length, 1)
      assertEquals(albums.head.name, "Dark Side of the Moon")
      assertEquals(albums.head.artist, "Pink Floyd")
      assertEquals(albums.head.format, AlbumFormat.Vinyl)
      assertEquals(albums.head.status, WishlistStatus.Wanted)
      assertEquals(albums.head.id, sampleAlbumId)
    }
  }

  tempRepo.test("addAlbumToWishlist adds multiple albums") { repoDir =>
    for {
      service <- createService(repoDir)
      _ <- service.addAlbumToWishlist(sampleAlbum)
      _ <- service.addAlbumToWishlist(anotherAlbum)
      albums <- service.list
    } yield {
      assertEquals(albums.length, 2)
      assert(albums.exists(_.name == "Dark Side of the Moon"))
      assert(albums.exists(_.name == "Abbey Road"))
    }
  }

  tempRepo.test("orderAlbum updates album status to Ordered") { repoDir =>
    for {
      service <- createService(repoDir)
      _ <- service.addAlbumToWishlist(sampleAlbum)
      _ <- service.orderAlbum(sampleAlbumId)
      albums <- service.list
    } yield {
      assertEquals(albums.length, 1)
      assertEquals(albums.head.status, WishlistStatus.Ordered)
    }
  }

  tempRepo.test("confirmAlbumReceived updates album status to Received") { repoDir =>
    for {
      service <- createService(repoDir)
      _ <- service.addAlbumToWishlist(sampleAlbum)
      _ <- service.confirmAlbumReceived(sampleAlbumId)
      albums <- service.list
    } yield assertEquals(albums.length, 0)
  }

  tempRepo.test("confirmAlbumReceived raises error for non-existent album") { repoDir =>
    for {
      service <- createService(repoDir)
      result <- service.confirmAlbumReceived("nonexistent-id").attempt
    } yield {
      assert(result.isLeft)
      assert(
        result.left.exists(_.getMessage.contains("Album not found in wishlist"))
      )
    }
  }

  tempRepo.test("confirmAlbumReceived publishes event to event bus") { repoDir =>
    for {
      eventBus <- EventBus.create[WishlistAlbum]
      service <- createService(repoDir, eventBus)
      publishedEvents <- IO.ref(List.empty[WishlistAlbum])
      _ <- service.addAlbumToWishlist(sampleAlbum)
      fiber <- eventBus
        .subscribe(event => publishedEvents.update(_ :+ event))
        .compile
        .drain
        .start
      _ <- IO.sleep(scala.concurrent.duration.DurationInt(100).millis)
      _ <- service.confirmAlbumReceived(sampleAlbumId)
      _ <- IO.sleep(scala.concurrent.duration.DurationInt(100).millis)
      events <- publishedEvents.get
      _ <- fiber.cancel
    } yield {
      assertEquals(events.length, 1)
      assertEquals(events.head.name, "Dark Side of the Moon")
      assertEquals(events.head.status, WishlistStatus.Received)
    }
  }

  tempRepo.test("orderAlbum works for multiple albums independently") { repoDir =>
    for {
      service <- createService(repoDir)
      _ <- service.addAlbumToWishlist(sampleAlbum)
      _ <- service.addAlbumToWishlist(anotherAlbum)
      _ <- service.orderAlbum(anotherAlbumId)
      albums <- service.list
    } yield {
      val darkSide = albums.find(_.name == "Dark Side of the Moon").get
      val abbeyRoad = albums.find(_.name == "Abbey Road").get
      assertEquals(darkSide.status, WishlistStatus.Wanted)
      assertEquals(abbeyRoad.status, WishlistStatus.Ordered)
    }
  }
}
