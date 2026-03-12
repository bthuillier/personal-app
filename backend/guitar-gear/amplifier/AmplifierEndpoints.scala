package guitargear.amplifier

import cats.effect.IO

object AmplifierEndpoints {

  import sttp.tapir.*
  import sttp.tapir.json.circe.*
  import sttp.tapir.server.ServerEndpoint

  val listAmplifierEndpoint =
    endpoint.get
      .name("List Amplifiers")
      .in("amplifiers")
      .out(jsonBody[List[Amplifier]])

  private def listAmplifierEndpointImpl(
      service: AmplifierService
  ) = listAmplifierEndpoint.serverLogicSuccess { _ =>
    IO.pure(service.list)
  }

  val endpointDefinitions = List(
    listAmplifierEndpoint
  )

  def endpoints(
      service: AmplifierService
  ): List[ServerEndpoint[Any, IO]] = List(
    listAmplifierEndpointImpl(service)
  )

}
