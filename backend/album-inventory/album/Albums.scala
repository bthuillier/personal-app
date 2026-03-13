package album

import cats.effect.IO
import sttp.tapir.*
import sttp.tapir.json.circe.*
import sttp.tapir.server.ServerEndpoint

object Albums {

  val listAlbums =
    endpoint.get
      .name("List Albums")
      .in("albums")
      .out(jsonBody[List[album.PartialAlbum]])

  val createAlbum =
    endpoint.post
      .name("Create Album")
      .in("albums")
      .in(jsonBody[album.AlbumService.CreateAlbum])
      .out(emptyOutput)

  val endpointDefininitions = List(
    listAlbums,
    createAlbum
  )

  private def listAlbumsLogic(
      service: album.AlbumService
  ): ServerEndpoint[Any, IO] =
    listAlbums.serverLogicSuccess(_ => service.list)

  private def createAlbumLogic(
      service: album.AlbumService
  ): ServerEndpoint[Any, IO] =
    createAlbum.serverLogicSuccess { request =>
      service.create(request)
    }

  def endpoints(service: album.AlbumService): List[ServerEndpoint[Any, IO]] =
    List(
      listAlbumsLogic(service),
      createAlbumLogic(service)
    )

}
