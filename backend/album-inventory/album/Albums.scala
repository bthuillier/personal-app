package album

import cats.effect.IO
import sttp.tapir.*
import sttp.tapir.json.circe.*
import sttp.tapir.server.ServerEndpoint

object Albums {

  val listAlbums =
    endpoint.get
      .in("albums")
      .out(jsonBody[List[album.PartialAlbum]])

  val endpointDefininitions = List(
    listAlbums
  )

  private def listAlbumsLogic(
      service: album.AlbumService
  ): ServerEndpoint[Any, IO] =
    listAlbums.serverLogicSuccess(_ => service.list)

  def endpoints(service: album.AlbumService): List[ServerEndpoint[Any, IO]] =
    List(
      listAlbumsLogic(service)
    )

}
