import guitargear.GuitarGear
import sttp.tapir.server.netty.cats.NettyCatsServer
import cats.effect.ResourceApp
import cats.effect.{IO, Resource}
import sttp.tapir.server.netty.cats.NettyCatsServerOptions
import cats.effect.std.Dispatcher
import sttp.tapir.server.interceptor.cors.CORSInterceptor
import sttp.tapir.server.interceptor.cors.CORSConfig
import wishlist.WishlistService
import cats.effect.std.Env
import json.GitCommitter

object App extends ResourceApp.Forever {
  override def run(args: List[String]): Resource[IO, Unit] =
    for {
      dispatcher <- Dispatcher.parallel[IO]
      basePath <- Resource.eval(Env[IO].get("DB_BASE_PATH").map(_.getOrElse("data")))
      given GitCommitter <- Resource.eval(GitCommitter.create(basePath))
      eventBus <- Resource.eval(
        eventbus.EventBus.create[wishlist.WishlistAlbum]
      )
      wishlists <- Resource.eval(
        WishlistService.fileBacked(s"$basePath/music-inventory/wishlist", eventBus)
      )
      albums <- Resource.eval(
        album.AlbumService.fileBacked(s"$basePath/music-inventory/albums")
      )
      _ <- Resource.eval(
        albums.addHandler(eventBus).start
      )
      guitarGearEndpoints <- Resource.eval(GuitarGear.endpoints(basePath))
      server = NettyCatsServer[IO](
        NettyCatsServerOptions
        .customiseInterceptors[IO](dispatcher)
        .exceptionHandler(JsonExceptionHandler[IO])
        .corsInterceptor(CORSInterceptor.customOrThrow(
              CORSConfig.default.allowAllHeaders.allowAllMethods.allowAllOrigins
            ))
            .options
      )
      _ <-
        Resource.make {
          server
            .port(8080)
            .host("0.0.0.0")
            .addEndpoints(
              wishlist.AlbumWishlists.endpoints(wishlists) ++
                album.Albums.endpoints(albums) ++
                guitarGearEndpoints
            )
            .start()
        } {
          _.stop()
        }

    } yield ()
}
