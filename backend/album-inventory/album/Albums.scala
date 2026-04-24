package album

import cats.effect.IO
import sttp.tapir.*
import cats.syntax.all.*
import sttp.tapir.json.circe.*
import sttp.tapir.server.ServerEndpoint
import io.circe.Codec
import sttp.model.StatusCode

object Albums {

  sealed trait ErrorResponse
  case class NotFound(message: String) extends ErrorResponse
      derives Codec.AsObject,
        Schema
  case class InternalServerError(message: String) extends ErrorResponse
      derives Codec.AsObject,
        Schema

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

  val getAlbumById =
    endpoint.get
      .name("Get Album By ID")
      .in("albums" / path[String]("albumId"))
      .out(jsonBody[album.PartialAlbum])
      .errorOut(statusCode(StatusCode.NotFound).and(jsonBody[NotFound]))

  val addGenreToAlbum =
    endpoint.post
      .name("Add Genre To Album")
      .in("albums" / path[String]("albumId") / "genres")
      .in(query[String]("genre"))
      .out(emptyOutput)
      .errorOut(
        oneOf[ErrorResponse](
          oneOfVariant(statusCode(StatusCode.NotFound).and(jsonBody[NotFound])),
          oneOfVariant(
            statusCode(StatusCode.InternalServerError)
              .and(jsonBody[InternalServerError])
          )
        )
      )

  val removeGenreFromAlbum =
    endpoint.delete
      .name("Remove Genre From Album")
      .in("albums" / path[String]("albumId") / "genres")
      .in(query[String]("genre"))
      .out(emptyOutput)
      .errorOut(
        oneOf[ErrorResponse](
          oneOfVariant(statusCode(StatusCode.NotFound).and(jsonBody[NotFound])),
          oneOfVariant(
            statusCode(StatusCode.InternalServerError)
              .and(jsonBody[InternalServerError])
          )
        )
      )

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

  private def getAlbumByIdLogic(
      service: album.AlbumService
  ): ServerEndpoint[Any, IO] =
    getAlbumById.serverLogic { albumId =>
      service.getById(albumId).map {
        case Some(album) => Right(album)
        case None        => Left(NotFound(s"Album with id $albumId not found"))
      }
    }

  private def addGenreToAlbumLogic(
      service: album.AlbumService
  ): ServerEndpoint[Any, IO] =
    addGenreToAlbum.serverLogic { case (albumId, genre) =>
      service
        .addGenre(albumId, genre)
        .attemptNarrow[AlbumNotFoundException]
        .map {
          _.leftMap({ case AlbumNotFoundException(_) =>
            NotFound(s"Album with id $albumId not found")
          })
        }
    }

  private def removeGenreFromAlbumLogic(
      service: album.AlbumService
  ): ServerEndpoint[Any, IO] =
    removeGenreFromAlbum.serverLogic { case (albumId, genre) =>
      service
        .removeGenre(albumId, genre)
        .attemptNarrow[AlbumNotFoundException]
        .map {
          _.leftMap({ case AlbumNotFoundException(_) =>
            NotFound(s"Album with id $albumId not found")
          })
        }
    }

  def endpoints(service: album.AlbumService): List[ServerEndpoint[Any, IO]] =
    List(
      listAlbumsLogic(service),
      createAlbumLogic(service),
      getAlbumByIdLogic(service),
      addGenreToAlbumLogic(service),
      removeGenreFromAlbumLogic(service)
    )

}
