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
import java.nio.file.Paths

object App extends ResourceApp.Forever {
  override def run(args: List[String]): Resource[IO, Unit] =
    for {
      dispatcher <- Dispatcher.parallel[IO]
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
      _ <-
        Resource.make {
          server
            .port(8080)
            .host("0.0.0.0")
            .addEndpoints(albumInventoryEndpoints ++ guitarGearEndpoints)
            .start()
        } {
          _.stop()
        }

    } yield ()
}
