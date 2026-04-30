package guitargear.guitar

import cats.effect.IO
import cats.syntax.all.*
import guitargear.strings.StringRecommendation
import http.ErrorResponse
import http.ErrorResponse.{BadRequest, NotFound}
import io.circe.Codec
import sttp.model.StatusCode
import sttp.tapir.*
import sttp.tapir.json.circe.*
import sttp.tapir.server.ServerEndpoint

final case class StringRecommendationRequest(
    targetTuning: GuitarTuning
) derives Codec.AsObject,
      Schema

final case class StringRecommendationResponse(
    recommendations: List[StringRecommendation]
) derives Codec.AsObject,
      Schema

object Guitars {

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
      .in("guitars" / path[String]("id") / "events")
      .out(jsonBody[List[GuitarEvent]])
      .errorOut(statusCode(StatusCode.NotFound))

  private def getGuitarEventsEndpointImpl(
      guitarService: GuitarService
  ) = getGuitarEventsEndpoint.serverLogic { id =>
    guitarService.find(id).map {
      case None => Left(())
      case Some(guitar) => Right(guitar.events.getOrElse(List.empty))
    }
  }

  val handleGuitarCommandEndpoint =
    endpoint.post
      .name("Handle Guitar Command")
      .in("guitars" / path[String]("id") / "commands")
      .in(jsonBody[GuitarCommand])
      .out(jsonBody[Guitar])
      .errorOut(statusCode(StatusCode.NotFound))

  private def handleGuitarCommandEndpointImpl(
      guitarService: GuitarService
  ) = handleGuitarCommandEndpoint.serverLogic { case (id, command) =>
    guitarService.handle(id, command).map {
      case Left(_) => Left(())
      case Right(guitar) => Right(guitar)
    }
  }

  val recommendStringsEndpoint =
    endpoint.post
      .name("Recommend Strings")
      .in("guitars" / path[String]("id") / "string-recommendation")
      .in(jsonBody[StringRecommendationRequest])
      .out(jsonBody[StringRecommendationResponse])
      .errorOut(
        oneOf[ErrorResponse](
          ErrorResponse.notFoundVariant,
          ErrorResponse.badRequestVariant
        )
      )

  private def recommendStringsEndpointImpl(
      guitarService: GuitarService
  ) = recommendStringsEndpoint.serverLogic { case (id, request) =>
    guitarService
      .recommendStrings(id, request.targetTuning)
      .attemptNarrow[Throwable]
      .map {
        _.bimap(
          {
            case GuitarNotFoundException(_) =>
              NotFound(s"Guitar with id $id not found")
            case StringRecommendationException(message) =>
              BadRequest(message)
            case e => BadRequest(e.getMessage)
          },
          recs => StringRecommendationResponse(recs)
        )
      }
  }

  val endpointDefinitions = List(
    listGuitarsEndpoint,
    getGuitarEventsEndpoint,
    handleGuitarCommandEndpoint,
    recommendStringsEndpoint
  )

  def endpoints(
      guitarService: GuitarService
  ): List[ServerEndpoint[Any, IO]] = List(
    listGuitarsEndpointImpl(guitarService),
    getGuitarEventsEndpointImpl(guitarService),
    handleGuitarCommandEndpointImpl(guitarService),
    recommendStringsEndpointImpl(guitarService)
  )

}
