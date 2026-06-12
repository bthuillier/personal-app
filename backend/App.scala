import albuminventory.AlbumInventory
import guitargear.GuitarGear
import sttp.tapir.server.netty.cats.NettyCatsServer
import cats.effect.ResourceApp
import cats.effect.{IO, Resource}
import sttp.tapir.server.netty.cats.NettyCatsServerOptions
import cats.effect.std.Dispatcher
import sttp.tapir.server.interceptor.cors.CORSInterceptor
import sttp.tapir.server.interceptor.cors.CORSConfig
import cats.effect.std.Env
import json.GitCommitter
import filedb.FileDBEngine
import sttp.tapir.emptyInput
import sttp.tapir.files.{staticFilesGetServerEndpoint, FilesOptions}
import sttp.tapir.server.ServerEndpoint
import org.typelevel.log4cats.Logger
import org.typelevel.log4cats.slf4j.Slf4jLogger
import java.nio.file.{Files, Paths}

object App extends ResourceApp.Forever {
  override def run(args: List[String]): Resource[IO, Unit] =
    for {
      dispatcher <- Dispatcher.parallel[IO]
      logger <- Resource.eval(Slf4jLogger.fromName[IO]("App"))
      basePath <- Resource.eval(
        Env[IO].get("DB_BASE_PATH").map(_.getOrElse("data"))
      )
      given GitCommitter <- Resource.eval(GitCommitter.create(basePath))
      engine <- Resource.eval(
        FileDBEngine[IO](Paths.get(basePath), Paths.get("."))
      )
      musicDb <- Resource.eval(engine.db(AlbumInventory.dbName))
      guitarDb <- Resource.eval(engine.db(GuitarGear.dbName))
      albumInventoryEndpoints <- AlbumInventory.endpoints(musicDb)
      guitarGearEndpoints <- Resource.eval(GuitarGear.endpoints(guitarDb))
      frontendEndpoints <- Resource.eval(frontendEndpoints(logger))
      server = NettyCatsServer[IO](
        NettyCatsServerOptions
          .customiseInterceptors[IO](dispatcher)
          .exceptionHandler(JsonExceptionHandler[IO])
          .corsInterceptor(
            CORSInterceptor.customOrThrow(
              CORSConfig.default.allowAllHeaders.allowAllMethods.allowAllOrigins
            )
          )
          .options
      )
      binding <-
        Resource.make {
          server
            .port(8080)
            .host("0.0.0.0")
            .addEndpoints(
              albumInventoryEndpoints ++ guitarGearEndpoints ++ frontendEndpoints
            )
            .start()
        } {
          _.stop()
        }
      _ <- Resource.eval(
        logger.info(s"Server started at http://localhost:${binding.port}")
      )

    } yield ()

  /**
   * Serves the built frontend (if present) at the root path, falling back to
   * index.html for SPA routes. API endpoints are all under /api, so they
   * never conflict.
   */
  private def frontendEndpoints(
      logger: Logger[IO]
  ): IO[List[ServerEndpoint[Any, IO]]] =
    for {
      distPath <- Env[IO].get("FRONTEND_DIST").map(_.getOrElse("frontend/dist"))
      exists <- IO(Files.isDirectory(Paths.get(distPath)))
      _ <-
        if (exists) logger.info(s"Serving frontend from $distPath")
        else
          logger.warn(s"Frontend build not found at $distPath, serving API only")
    } yield
      if (exists)
        List(
          staticFilesGetServerEndpoint[IO](emptyInput)(
            distPath,
            FilesOptions.default[IO].defaultFile(List("index.html"))
          )
        )
      else Nil
}
