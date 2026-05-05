package guitargear.amplifier

import cats.effect.IO
import sttp.model.StatusCode
import sttp.tapir.*
import sttp.tapir.json.circe.*
import sttp.tapir.server.ServerEndpoint

object AmplifierEndpoints {

  val listAmplifierEndpoint =
    endpoint.get
      .name("List Amplifiers")
      .in("amplifiers")
      .out(jsonBody[List[Amplifier]])

  private def listAmplifierEndpointImpl(
      service: AmplifierService
  ) = listAmplifierEndpoint.serverLogicSuccess { _ =>
    service.list
  }

  val getAmplifierEventsEndpoint =
    endpoint.get
      .name("Get Amplifier Events")
      .in("amplifiers" / path[String]("id") / "events")
      .out(jsonBody[List[AmplifierEvent]])
      .errorOut(statusCode(StatusCode.NotFound))

  private def getAmplifierEventsEndpointImpl(
      service: AmplifierService
  ) = getAmplifierEventsEndpoint.serverLogic { id =>
    service.find(id).map {
      case None => Left(())
      case Some(amplifier) => Right(amplifier.events.getOrElse(List.empty))
    }
  }

  val handleAmplifierCommandEndpoint =
    endpoint.post
      .name("Handle Amplifier Command")
      .in("amplifiers" / path[String]("id") / "commands")
      .in(jsonBody[AmplifierCommand])
      .out(jsonBody[Amplifier])
      .errorOut(statusCode(StatusCode.NotFound))

  private def handleAmplifierCommandEndpointImpl(
      service: AmplifierService
  ) = handleAmplifierCommandEndpoint.serverLogic { case (id, command) =>
    service.handle(id, command).map {
      case Left(_) => Left(())
      case Right(amplifier) => Right(amplifier)
    }
  }

  val endpointDefinitions = List(
    listAmplifierEndpoint,
    getAmplifierEventsEndpoint,
    handleAmplifierCommandEndpoint
  )

  def endpoints(
      service: AmplifierService
  ): List[ServerEndpoint[Any, IO]] = List(
    listAmplifierEndpointImpl(service),
    getAmplifierEventsEndpointImpl(service),
    handleAmplifierCommandEndpointImpl(service)
  )

}
