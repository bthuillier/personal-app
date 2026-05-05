package guitargear.pedal

import cats.effect.IO
import sttp.model.StatusCode
import sttp.tapir.*
import sttp.tapir.json.circe.*
import sttp.tapir.server.ServerEndpoint

object GuitarPedals {

  val listGuitarPedalsEndpoint =
    endpoint.get
      .name("List Guitar Pedals")
      .in("guitar-pedals")
      .out(jsonBody[List[GuitarPedal]])

  private def listGuitarPedalsEndpointImpl(
      service: GuitarPedalService
  ) = listGuitarPedalsEndpoint.serverLogicSuccess { _ =>
    service.list
  }

  val getGuitarPedalEventsEndpoint =
    endpoint.get
      .name("Get Guitar Pedal Events")
      .in("guitar-pedals" / path[String]("id") / "events")
      .out(jsonBody[List[GuitarPedalEvent]])
      .errorOut(statusCode(StatusCode.NotFound))

  private def getGuitarPedalEventsEndpointImpl(
      service: GuitarPedalService
  ) = getGuitarPedalEventsEndpoint.serverLogic { id =>
    service.find(id).map {
      case None => Left(())
      case Some(pedal) => Right(pedal.events.getOrElse(List.empty))
    }
  }

  val handleGuitarPedalCommandEndpoint =
    endpoint.post
      .name("Handle Guitar Pedal Command")
      .in("guitar-pedals" / path[String]("id") / "commands")
      .in(jsonBody[GuitarPedalCommand])
      .out(jsonBody[GuitarPedal])
      .errorOut(statusCode(StatusCode.NotFound))

  private def handleGuitarPedalCommandEndpointImpl(
      service: GuitarPedalService
  ) = handleGuitarPedalCommandEndpoint.serverLogic { case (id, command) =>
    service.handle(id, command).map {
      case Left(_) => Left(())
      case Right(pedal) => Right(pedal)
    }
  }

  val endpointDefinitions = List(
    listGuitarPedalsEndpoint,
    getGuitarPedalEventsEndpoint,
    handleGuitarPedalCommandEndpoint
  )

  def endpoints(
      service: GuitarPedalService
  ): List[ServerEndpoint[Any, IO]] = List(
    listGuitarPedalsEndpointImpl(service),
    getGuitarPedalEventsEndpointImpl(service),
    handleGuitarPedalCommandEndpointImpl(service)
  )

}
