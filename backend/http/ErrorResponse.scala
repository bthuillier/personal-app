package http

import io.circe.Codec
import sttp.model.StatusCode
import sttp.tapir.Schema
import sttp.tapir.*
import sttp.tapir.json.circe.*

sealed trait ErrorResponse

object ErrorResponse {
  case class NotFound(message: String) extends ErrorResponse
      derives Codec.AsObject,
        Schema
  case class BadRequest(message: String) extends ErrorResponse
      derives Codec.AsObject,
        Schema
  case class InternalServerError(message: String) extends ErrorResponse
      derives Codec.AsObject,
        Schema

  def notFoundVariant =
    oneOfVariant(statusCode(StatusCode.NotFound).and(jsonBody[NotFound]))

  def badRequestVariant =
    oneOfVariant(statusCode(StatusCode.BadRequest).and(jsonBody[BadRequest]))

  def internalServerErrorVariant =
    oneOfVariant(
      statusCode(StatusCode.InternalServerError).and(jsonBody[InternalServerError])
    )
}
