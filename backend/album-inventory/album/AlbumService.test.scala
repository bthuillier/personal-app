package album

import cats.effect.IO
import java.time.LocalDate
import wishlist.{WishlistAlbum, WishlistStatus}
import eventbus.EventBus

class AlbumServiceTest extends munit.CatsEffectSuite {

  def createService(): AlbumService = {
    val store = AlbumStore.inMemory()
    AlbumService(store)
  }

  val sampleAlbum = PartialAlbum(
    name = "Dark Side of the Moon",
    artist = "Pink Floyd",
    format = AlbumFormat.Vinyl,
    releaseDate = LocalDate.of(1973, 3, 1)
  )

  val anotherAlbum = PartialAlbum(
    name = "Abbey Road",
    artist = "The Beatles",
    format = AlbumFormat.CD,
    releaseDate = LocalDate.of(1969, 9, 26)
  )

  val vinylVersionAlbum = PartialAlbum(
    name = "Abbey Road",
    artist = "The Beatles",
    format = AlbumFormat.Vinyl,
    releaseDate = LocalDate.of(1969, 9, 26)
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

  test("add overwrites existing album with same name, artist, and format") {
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

  test("PartialAlbum index is the lowercase first character of name") {
    assertEquals(sampleAlbum.index, 'p')
    assertEquals(anotherAlbum.index, 't')
  }

  test("addHandler subscribes to event bus and adds albums") {
    for {
      eventBus <- EventBus.create[WishlistAlbum]
      service = createService()
      wishlistAlbum = WishlistAlbum(
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

  test("addHandler processes multiple events from event bus") {
    for {
      eventBus <- EventBus.create[WishlistAlbum]
      service = createService()
      wishlistAlbum1 = WishlistAlbum(
        name = "Hotel California",
        artist = "Eagles",
        format = AlbumFormat.CD,
        releaseDate = LocalDate.of(1976, 12, 8),
        status = WishlistStatus.Received
      )
      wishlistAlbum2 = WishlistAlbum(
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
