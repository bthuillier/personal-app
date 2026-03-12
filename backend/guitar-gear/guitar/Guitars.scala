package guitargear.guitar

import cats.effect.IO
import sttp.model.StatusCode

object Guitars {

  import sttp.tapir.*
  import sttp.tapir.json.circe.*
  import sttp.tapir.server.ServerEndpoint

  val listGuitarsEndpoint =
    endpoint.get
      .name("List Guitars")
      .in("guitars")
      .out(jsonBody[List[Guitar]])

  private def listGuitarsEndpointImpl(
      guitarService: GuitarService
  ) = listGuitarsEndpoint.serverLogicSuccess { _ =>
    guitarService.list
  }

  val getGuitarEventsEndpoint =
    endpoint.get
      .name("Get Guitar Events")
      .in("guitars" / path[String]("serialNumber") / "events")
      .out(jsonBody[List[GuitarEvent]])
      .errorOut(statusCode(StatusCode.NotFound))

  private def getGuitarEventsEndpointImpl(
      guitarService: GuitarService
  ) = getGuitarEventsEndpoint.serverLogic { serial =>
    guitarService.find(serial).map {
      case None         => Left(())
      case Some(guitar) => Right(guitar.events.getOrElse(List.empty))
    }
  }

  val handleGuitarCommandEndpoint =
    endpoint.post
      .name("Handle Guitar Command")
      .in("guitars" / path[String]("serialNumber") / "commands")
      .in(jsonBody[GuitarCommand])
      .out(jsonBody[Guitar])
      .errorOut(statusCode(StatusCode.NotFound))

  private def handleGuitarCommandEndpointImpl(
      guitarService: GuitarService
  ) = handleGuitarCommandEndpoint.serverLogic { case (serial, command) =>
    guitarService.handle(serial, command).map {
      case Left(_)       => Left(())
      case Right(guitar) => Right(guitar)
    }
  }

  val endpointDefinitions = List(
    listGuitarsEndpoint,
    getGuitarEventsEndpoint,
    handleGuitarCommandEndpoint
  )

  def endpoints(
      guitarService: GuitarService
  ): List[ServerEndpoint[Any, IO]] = List(
    listGuitarsEndpointImpl(guitarService),
    getGuitarEventsEndpointImpl(guitarService),
    handleGuitarCommandEndpointImpl(guitarService)
  )

}
