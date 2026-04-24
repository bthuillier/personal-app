import io.circe.Codec
import sttp.capabilities.StreamMaxLengthExceededException
import sttp.model.StatusCode
import sttp.monad.MonadError
import sttp.tapir.server.model.{
  InvalidMultipartBodyException,
  ValuedEndpointOutput
}
import sttp.tapir.*
import sttp.tapir.server.interceptor.exception.{
  ExceptionContext,
  ExceptionHandler
}
import io.circe.syntax.*

case class ErrorResponse(error: String, message: String) derives Codec.AsObject

case class JsonExceptionHandler[F[_]](
    response: (StatusCode, ErrorResponse) => ValuedEndpointOutput[?]
) extends ExceptionHandler[F] {
  override def apply(
      ctx: ExceptionContext
  )(implicit monad: MonadError[F]): F[Option[ValuedEndpointOutput[?]]] =
    (ctx.e, ctx.e.getCause()) match {
      case (StreamMaxLengthExceededException(maxBytes), _) =>
        monad.unit(
          Some(
            response(
              StatusCode.PayloadTooLarge,
              ErrorResponse(
                "PayloadTooLarge",
                s"Payload limit (${maxBytes}B) exceeded"
              )
            )
          )
        )
      case (_, StreamMaxLengthExceededException(maxBytes)) =>
        monad.unit(
          Some(
            response(
              StatusCode.PayloadTooLarge,
              ErrorResponse(
                "PayloadTooLarge",
                s"Payload limit (${maxBytes}B) exceeded"
              )
            )
          )
        )
      case (InvalidMultipartBodyException(_, _), _) =>
        monad.unit(
          Some(
            response(
              StatusCode.BadRequest,
              ErrorResponse("InvalidMultipartBody", "Invalid multipart body")
            )
          )
        )
      case _ =>
        monad.unit(
          Some(
            response(
              StatusCode.InternalServerError,
              ErrorResponse("InternalServerError", "Internal server error")
            )
          )
        )
    }
}

object JsonExceptionHandler {
  def apply[F[_]]: ExceptionHandler[F] =
    JsonExceptionHandler[F]((code: StatusCode, body: ErrorResponse) =>
      ValuedEndpointOutput(
        statusCode.and(stringJsonBody),
        (code, body.asJson.noSpaces)
      )
    )
}
