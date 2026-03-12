package wishlist

import cats.effect.IO
import album.AlbumFormat
import java.time.LocalDate
import eventbus.EventBus

class WishlistServiceTest extends munit.CatsEffectSuite {

  def createService(): IO[WishlistService] =
    EventBus.create[WishlistAlbum].map { eventBus =>
      val store = WishlistStore.inMemory()
      WishlistService(store, eventBus)
    }

  val sampleAlbum = WishlistService.AddAlbumToWishlist(
    name = "Dark Side of the Moon",
    artist = "Pink Floyd",
    format = AlbumFormat.Vinyl,
    releaseDate = LocalDate.of(1973, 3, 1)
  )

  val anotherAlbum = WishlistService.AddAlbumToWishlist(
    name = "Abbey Road",
    artist = "The Beatles",
    format = AlbumFormat.CD,
    releaseDate = LocalDate.of(1969, 9, 26)
  )

  test("list returns empty list initially") {
    for {
      service <- createService()
      albums <- service.list
    } yield assertEquals(albums, List.empty[WishlistAlbum])
  }

  test("addAlbumToWishlist adds an album to the wishlist") {
    for {
      service <- createService()
      _ <- service.addAlbumToWishlist(sampleAlbum)
      albums <- service.list
    } yield {
      assertEquals(albums.length, 1)
      assertEquals(albums.head.name, "Dark Side of the Moon")
      assertEquals(albums.head.artist, "Pink Floyd")
      assertEquals(albums.head.format, AlbumFormat.Vinyl)
      assertEquals(albums.head.status, WishlistStatus.Wanted)
    }
  }

  test("addAlbumToWishlist adds multiple albums") {
    for {
      service <- createService()
      _ <- service.addAlbumToWishlist(sampleAlbum)
      _ <- service.addAlbumToWishlist(anotherAlbum)
      albums <- service.list
    } yield {
      assertEquals(albums.length, 2)
      assert(albums.exists(_.name == "Dark Side of the Moon"))
      assert(albums.exists(_.name == "Abbey Road"))
    }
  }

  test("orderAlbum updates album status to Ordered") {
    for {
      service <- createService()
      _ <- service.addAlbumToWishlist(sampleAlbum)
      _ <- service.orderAlbum("Dark Side of the Moon", "Pink Floyd")
      albums <- service.list
    } yield {
      assertEquals(albums.length, 1)
      assertEquals(albums.head.status, WishlistStatus.Ordered)
    }
  }

  test("confirmAlbumReceived updates album status to Received") {
    for {
      service <- createService()
      _ <- service.addAlbumToWishlist(sampleAlbum)
      _ <- service.confirmAlbumReceived("Dark Side of the Moon", "Pink Floyd")
      albums <- service.list
    } yield {
      assertEquals(albums.length, 0)
    }
  }

  test("confirmAlbumReceived raises error for non-existent album") {
    for {
      service <- createService()
      result <- service
        .confirmAlbumReceived("Non-existent Album", "Unknown Artist")
        .attempt
    } yield {
      assert(result.isLeft)
      assert(
        result.left.exists(_.getMessage.contains("Album not found in wishlist"))
      )
    }
  }

  test("confirmAlbumReceived publishes event to event bus") {
    for {
      eventBus <- EventBus.create[WishlistAlbum]
      store = WishlistStore.inMemory()
      service = WishlistService(store, eventBus)
      publishedEvents <- IO.ref(List.empty[WishlistAlbum])
      _ <- service.addAlbumToWishlist(sampleAlbum)
      fiber <- eventBus
        .subscribe(event => publishedEvents.update(_ :+ event))
        .compile
        .drain
        .start
      _ <- IO.sleep(scala.concurrent.duration.DurationInt(100).millis)
      _ <- service.confirmAlbumReceived("Dark Side of the Moon", "Pink Floyd")
      _ <- IO.sleep(scala.concurrent.duration.DurationInt(100).millis)
      events <- publishedEvents.get
      _ <- fiber.cancel
    } yield {
      assertEquals(events.length, 1)
      assertEquals(events.head.name, "Dark Side of the Moon")
      assertEquals(events.head.status, WishlistStatus.Received)
    }
  }

  test("orderAlbum works for multiple albums independently") {
    for {
      service <- createService()
      _ <- service.addAlbumToWishlist(sampleAlbum)
      _ <- service.addAlbumToWishlist(anotherAlbum)
      _ <- service.orderAlbum("Abbey Road", "The Beatles")
      albums <- service.list
    } yield {
      val darkSide = albums.find(_.name == "Dark Side of the Moon").get
      val abbeyRoad = albums.find(_.name == "Abbey Road").get
      assertEquals(darkSide.status, WishlistStatus.Wanted)
      assertEquals(abbeyRoad.status, WishlistStatus.Ordered)
    }
  }
}
