package album

import cats.effect.IO
import java.time.LocalDate
import wishlist.{WishlistAlbum, WishlistStatus}
import eventbus.EventBus
import utils.GenerateId
import cats.data.NonEmptySet

class AlbumServiceTest extends munit.CatsEffectSuite {

  def createService(): AlbumService = {
    val store = AlbumStore.inMemory()
    AlbumService(store)
  }

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

  test("list returns empty list initially") {
    val service = createService()
    for {
      albums <- service.list
    } yield assertEquals(albums, List.empty[PartialAlbum])
  }

  test("add adds an album to the collection") {
    val service = createService()
    for {
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

  test("add adds multiple albums") {
    val service = createService()
    for {
      _ <- service.add(sampleAlbum)
      _ <- service.add(anotherAlbum)
      albums <- service.list
    } yield {
      assertEquals(albums.length, 2)
      assert(albums.exists(_.name == "Dark Side of the Moon"))
      assert(albums.exists(_.name == "Abbey Road"))
    }
  }

  test("add stores same album in different formats separately") {
    val service = createService()
    for {
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

  test("add overwrites existing album with same id") {
    val service = createService()
    val updatedAlbum = sampleAlbum.copy(releaseDate = LocalDate.of(1973, 3, 15))
    for {
      _ <- service.add(sampleAlbum)
      _ <- service.add(updatedAlbum)
      albums <- service.list
    } yield {
      assertEquals(albums.length, 1)
      assertEquals(albums.head.releaseDate, LocalDate.of(1973, 3, 15))
    }
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

  test("addHandler subscribes to event bus and adds albums") {
    for {
      eventBus <- EventBus.create[WishlistAlbum]
      service = createService()
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

  test("addGenre adds genre to existing album") {
    val service = createService()
    for {
      _ <- service.add(sampleAlbum)
      _ <- service.addGenre(sampleAlbum.id, "Progressive Rock")
      album <- service.getById(sampleAlbum.id)
    } yield {
      assertEquals(album.isDefined, true)
      assertEquals(album.get.genre, Some(NonEmptySet.one("Progressive Rock")))
    }
  }

  test("setReview attaches review to existing album") {
    val service = createService()
    val review = Review(
      title = "A masterpiece",
      rating = Rating.unsafe(8),
      description = "Great album"
    )
    for {
      _ <- service.add(sampleAlbum)
      _ <- service.setReview(sampleAlbum.id, review)
      album <- service.getById(sampleAlbum.id)
    } yield assertEquals(album.flatMap(_.review), Some(review))
  }

  test("setReview overwrites the previous review") {
    val service = createService()
    val initial =
      Review(title = "Initial", rating = Rating.unsafe(4), description = "Meh")
    val updated = Review(
      title = "Updated",
      rating = Rating.unsafe(9),
      description = "Grew on me"
    )
    for {
      _ <- service.add(sampleAlbum)
      _ <- service.setReview(sampleAlbum.id, initial)
      _ <- service.setReview(sampleAlbum.id, updated)
      album <- service.getById(sampleAlbum.id)
    } yield assertEquals(album.flatMap(_.review), Some(updated))
  }

  test("setReview fails when album does not exist") {
    val service = createService()
    val review = Review(
      title = "Solid",
      rating = Rating.unsafe(7),
      description = "Solid"
    )
    service
      .setReview("missing-id", review)
      .attempt
      .map {
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

  test("removeGenre removes genre from existing album") {
    val service = createService()
    for {
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

  test("addHandler processes multiple events from event bus") {
    for {
      eventBus <- EventBus.create[WishlistAlbum]
      service = createService()
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
