package guitargear.pedal

import cats.effect.IO

object GuitarPedals {

  import sttp.tapir.*
  import sttp.tapir.json.circe.*
  import sttp.tapir.server.ServerEndpoint

  val listGuitarPedalsEndpoint =
    endpoint.get
      .name("List Guitar Pedals")
      .in("guitar-pedals")
      .out(jsonBody[List[GuitarPedal]])

  private def listGuitarPedalsEndpointImpl(
      service: GuitarPedalService
  ) = listGuitarPedalsEndpoint.serverLogicSuccess { _ =>
    IO.pure(service.list)
  }

  val endpointDefinitions = List(
    listGuitarPedalsEndpoint
  )

  def endpoints(
      service: GuitarPedalService
  ): List[ServerEndpoint[Any, IO]] = List(
    listGuitarPedalsEndpointImpl(service)
  )

}
