package wishlist

import cats.effect.IO
import wishlist.WishlistService.AddAlbumToWishlist

object AlbumWishlists {
  import sttp.tapir.*
  import sttp.tapir.json.circe.*
  import sttp.tapir.server.ServerEndpoint
  import http.apiEndpoint

  val listAlbums =
    apiEndpoint.get
      .name("List Wishlist Albums")
      .in("wishlist" / "albums")
      .out(jsonBody[List[WishlistAlbum]])

  val addAlbumToWishlist =
    apiEndpoint.post
      .name("Add Album to Wishlist")
      .in("wishlist" / "albums")
      .in(jsonBody[WishlistService.AddAlbumToWishlist])
      .out(emptyOutput)

  val confirmAlbumReceived =
    apiEndpoint.post
      .name("Confirm Album Received")
      .in("wishlist" / "albums" / path[String]("id") / "received")
      .out(emptyOutput)

  val orderAlbum =
    apiEndpoint.post
      .name("Order Album")
      .in("wishlist" / "albums" / path[String]("id") / "order")
      .out(emptyOutput)

  val endpointDefininitions = List(
    listAlbums,
    addAlbumToWishlist,
    confirmAlbumReceived,
    orderAlbum
  )

  private def listAlbumsLogic(
      service: WishlistService
  ): ServerEndpoint[Any, IO] =
    listAlbums.serverLogicSuccess(_ => service.list)

  private def addAlbumToWishlistLogic(
      service: WishlistService
  ): ServerEndpoint[Any, IO] =
    addAlbumToWishlist.serverLogicSuccess { album =>
      service.addAlbumToWishlist(album)
    }

  private def confirmAlbumReceivedLogic(
      service: WishlistService
  ): ServerEndpoint[Any, IO] =
    confirmAlbumReceived.serverLogicSuccess { id =>
      service.confirmAlbumReceived(id)
    }

  private def orderAlbumLogic(
      service: WishlistService
  ): ServerEndpoint[Any, IO] =
    orderAlbum.serverLogicSuccess { id =>
      service.orderAlbum(id)
    }

  def endpoints(service: WishlistService): List[ServerEndpoint[Any, IO]] =
    List(
      listAlbumsLogic(service),
      addAlbumToWishlistLogic(service),
      confirmAlbumReceivedLogic(service),
      orderAlbumLogic(service)
    )

}
