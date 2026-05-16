package album

import cats.effect.IO
import java.time.LocalDate
import wishlist.{WishlistAlbum, WishlistStatus}
import eventbus.EventBus
import filedb.FileDBEngine
import json.{GitCommitter, GitRepoFixture}
import munit.CatsEffectSuite
import utils.GenerateId
import cats.data.NonEmptySet

import java.nio.file.{Path, Paths}

class AlbumServiceTest extends CatsEffectSuite with GitRepoFixture {
  override protected def tempRepoPrefix: String = "album-service-test"

  private def createService(repoDir: Path): IO[AlbumService] =
    for {
      gitCommitter <- GitCommitter.create(repoDir.toString)
      engine <- FileDBEngine[IO](repoDir, Paths.get("."))
      db <- engine.db("music-inventory")
      service <- {
        given GitCommitter = gitCommitter
        AlbumService.fileBacked(db)
      }
    } yield service

  val sampleAlbum = PartialAlbum(
    id = GenerateId.makeId("Dark Side of the Moon", "Pink Floyd", "Vinyl")(),
    name = "Dark Side of the Moon",
    artist = "Pink Floyd",
    format = AlbumFormat.Vinyl,
    releaseDate = LocalDate.of(1973, 3, 1),
    genre = None,
    review = None
  )

  val anotherAlbum = PartialAlbum(
    id = GenerateId.makeId("Abbey Road", "The Beatles", "CD")(),
    name = "Abbey Road",
    artist = "The Beatles",
    format = AlbumFormat.CD,
    releaseDate = LocalDate.of(1969, 9, 26),
    genre = None,
    review = None
  )

  val vinylVersionAlbum = PartialAlbum(
    id = GenerateId.makeId("Abbey Road", "The Beatles", "Vinyl")(),
    name = "Abbey Road",
    artist = "The Beatles",
    format = AlbumFormat.Vinyl,
    releaseDate = LocalDate.of(1969, 9, 26),
    genre = None,
    review = None
  )

  tempRepo.test("list returns empty list initially") { repoDir =>
    for {
      service <- createService(repoDir)
      albums <- service.list
    } yield assertEquals(albums, List.empty[PartialAlbum])
  }

  tempRepo.test("add adds an album to the collection") { repoDir =>
    for {
      service <- createService(repoDir)
      _ <- service.add(sampleAlbum)
      albums <- service.list
    } yield {
      assertEquals(albums.length, 1)
      assertEquals(albums.head.name, "Dark Side of the Moon")
      assertEquals(albums.head.artist, "Pink Floyd")
      assertEquals(albums.head.format, AlbumFormat.Vinyl)
      assertEquals(albums.head.releaseDate, LocalDate.of(1973, 3, 1))
    }
  }

  tempRepo.test("add adds multiple albums") { repoDir =>
    for {
      service <- createService(repoDir)
      _ <- service.add(sampleAlbum)
      _ <- service.add(anotherAlbum)
      albums <- service.list
    } yield {
      assertEquals(albums.length, 2)
      assert(albums.exists(_.name == "Dark Side of the Moon"))
      assert(albums.exists(_.name == "Abbey Road"))
    }
  }

  tempRepo.test("add stores same album in different formats separately") { repoDir =>
    for {
      service <- createService(repoDir)
      _ <- service.add(anotherAlbum)
      _ <- service.add(vinylVersionAlbum)
      albums <- service.list
    } yield {
      assertEquals(albums.length, 2)
      val abbeyRoadAlbums = albums.filter(_.name == "Abbey Road")
      assertEquals(abbeyRoadAlbums.length, 2)
      assert(abbeyRoadAlbums.exists(_.format == AlbumFormat.CD))
      assert(abbeyRoadAlbums.exists(_.format == AlbumFormat.Vinyl))
    }
  }

  tempRepo.test("add fails if an album with the same id already exists") { repoDir =>
    for {
      service <- createService(repoDir)
      _ <- service.add(sampleAlbum)
      result <- service.add(sampleAlbum).attempt
    } yield assert(result.isLeft, s"expected failure on duplicate add, got: $result")
  }

  test("PartialAlbum.fromWishlist converts WishlistAlbum correctly") {
    val wishlistAlbum = WishlistAlbum(
      id = GenerateId.makeId("The Wall", "Pink Floyd")(),
      name = "The Wall",
      artist = "Pink Floyd",
      format = AlbumFormat.Vinyl,
      releaseDate = LocalDate.of(1979, 11, 30),
      status = WishlistStatus.Received
    )

    val partialAlbum = PartialAlbum.fromWishlist(wishlistAlbum)

    assertEquals(partialAlbum.name, "The Wall")
    assertEquals(partialAlbum.artist, "Pink Floyd")
    assertEquals(partialAlbum.format, AlbumFormat.Vinyl)
    assertEquals(partialAlbum.releaseDate, LocalDate.of(1979, 11, 30))
  }

  tempRepo.test("addHandler subscribes to event bus and adds albums") { repoDir =>
    for {
      eventBus <- EventBus.create[WishlistAlbum]
      service <- createService(repoDir)
      wishlistAlbum = WishlistAlbum(
        id = GenerateId.makeId("Led Zeppelin IV", "Led Zeppelin")(),
        name = "Led Zeppelin IV",
        artist = "Led Zeppelin",
        format = AlbumFormat.Vinyl,
        releaseDate = LocalDate.of(1971, 11, 8),
        status = WishlistStatus.Received
      )
      fiber <- service.addHandler(eventBus).start
      _ <- IO.sleep(scala.concurrent.duration.DurationInt(100).millis)
      _ <- eventBus.publish(wishlistAlbum)
      _ <- IO.sleep(scala.concurrent.duration.DurationInt(100).millis)
      albums <- service.list
      _ <- fiber.cancel
    } yield {
      assertEquals(albums.length, 1)
      assertEquals(albums.head.name, "Led Zeppelin IV")
      assertEquals(albums.head.artist, "Led Zeppelin")
    }
  }

  tempRepo.test("addGenre adds genre to existing album") { repoDir =>
    for {
      service <- createService(repoDir)
      _ <- service.add(sampleAlbum)
      _ <- service.addGenre(sampleAlbum.id, "Progressive Rock")
      album <- service.getById(sampleAlbum.id)
    } yield {
      assertEquals(album.isDefined, true)
      assertEquals(album.get.genre, Some(NonEmptySet.one("Progressive Rock")))
    }
  }

  tempRepo.test("setReview attaches review to existing album") { repoDir =>
    val review = Review(
      title = "A masterpiece",
      rating = Rating.unsafe(8),
      description = "Great album"
    )
    for {
      service <- createService(repoDir)
      _ <- service.add(sampleAlbum)
      _ <- service.setReview(sampleAlbum.id, review)
      album <- service.getById(sampleAlbum.id)
    } yield assertEquals(album.flatMap(_.review), Some(review))
  }

  tempRepo.test("setReview overwrites the previous review") { repoDir =>
    val initial =
      Review(title = "Initial", rating = Rating.unsafe(4), description = "Meh")
    val updated = Review(
      title = "Updated",
      rating = Rating.unsafe(9),
      description = "Grew on me"
    )
    for {
      service <- createService(repoDir)
      _ <- service.add(sampleAlbum)
      _ <- service.setReview(sampleAlbum.id, initial)
      _ <- service.setReview(sampleAlbum.id, updated)
      album <- service.getById(sampleAlbum.id)
    } yield assertEquals(album.flatMap(_.review), Some(updated))
  }

  tempRepo.test("setReview fails when album does not exist") { repoDir =>
    val review = Review(
      title = "Solid",
      rating = Rating.unsafe(7),
      description = "Solid"
    )
    for {
      service <- createService(repoDir)
      result <- service.setReview("missing-id", review).attempt
    } yield result match {
      case Left(_: AlbumNotFoundException) => ()
      case other => fail(s"expected AlbumNotFoundException, got $other")
    }
  }

  test("Rating.from accepts values within [0, 10]") {
    assert(Rating.from(0).isRight)
    assert(Rating.from(10).isRight)
    assert(Rating.from(5).isRight)
  }

  test("Rating.from rejects values outside [0, 10]") {
    assert(Rating.from(-1).isLeft)
    assert(Rating.from(11).isLeft)
  }

  test("Review JSON decoder rejects ratings outside [0, 10]") {
    import io.circe.parser.decode
    assert(decode[Review]("""{"title": "t", "rating": 11, "description": "x"}""").isLeft)
    assert(decode[Review]("""{"title": "t", "rating": -1, "description": "x"}""").isLeft)
    assert(decode[Review]("""{"title": "t", "rating": 7, "description": "x"}""").isRight)
  }

  tempRepo.test("removeGenre removes genre from existing album") { repoDir =>
    for {
      service <- createService(repoDir)
      _ <- service.add(sampleAlbum)
      _ <- service.addGenre(sampleAlbum.id, "Progressive Rock")
      _ <- service.addGenre(sampleAlbum.id, "Classic Rock")
      _ <- service.removeGenre(sampleAlbum.id, "Progressive Rock")
      album <- service.getById(sampleAlbum.id)
    } yield {
      assertEquals(album.isDefined, true)
      assertEquals(album.get.genre, Some(NonEmptySet.one("Classic Rock")))
    }
  }

  tempRepo.test("addHandler processes multiple events from event bus") { repoDir =>
    for {
      eventBus <- EventBus.create[WishlistAlbum]
      service <- createService(repoDir)
      wishlistAlbum1 = WishlistAlbum(
        id = GenerateId.makeId("Hotel California", "Eagles")(),
        name = "Hotel California",
        artist = "Eagles",
        format = AlbumFormat.CD,
        releaseDate = LocalDate.of(1976, 12, 8),
        status = WishlistStatus.Received
      )
      wishlistAlbum2 = WishlistAlbum(
        id = GenerateId.makeId("Rumours", "Fleetwood Mac")(),
        name = "Rumours",
        artist = "Fleetwood Mac",
        format = AlbumFormat.Vinyl,
        releaseDate = LocalDate.of(1977, 2, 4),
        status = WishlistStatus.Received
      )
      fiber <- service.addHandler(eventBus).start
      _ <- IO.sleep(scala.concurrent.duration.DurationInt(100).millis)
      _ <- eventBus.publish(wishlistAlbum1)
      _ <- eventBus.publish(wishlistAlbum2)
      _ <- IO.sleep(scala.concurrent.duration.DurationInt(100).millis)
      albums <- service.list
      _ <- fiber.cancel
    } yield {
      assertEquals(albums.length, 2)
      assert(albums.exists(_.name == "Hotel California"))
      assert(albums.exists(_.name == "Rumours"))
    }
  }
}
