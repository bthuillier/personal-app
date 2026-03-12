import sttp.tapir.server.netty.cats.NettyCatsServer
import cats.effect.ResourceApp
import cats.effect.{IO, Resource}
import sttp.tapir.server.netty.cats.NettyCatsServerOptions
import cats.effect.std.Dispatcher
import sttp.tapir.server.interceptor.cors.CORSInterceptor
import sttp.tapir.server.interceptor.cors.CORSConfig
import wishlist.WishlistService
import cats.effect.std.Env

object App extends ResourceApp.Forever {
  override def run(args: List[String]): Resource[IO, Unit] =
    for {
      dispatcher <- Dispatcher.parallel[IO]
      basePathOpt <- Resource.Eval(Env[IO].get("DB_BASE_PATH"))
      basePath = basePathOpt.getOrElse("data")
      eventBus <- Resource.Eval(
        eventbus.EventBus.create[wishlist.WishlistAlbum]
      )
      wishlists <- Resource.eval(
        WishlistService.fileBacked(s"$basePath/wishlist.json", eventBus)
      )
      albums <- Resource.eval(
        album.AlbumService.fileBacked(s"$basePath/albums")
      )
      _ <- Resource.eval(
        albums.addHandler(eventBus).start
      )
      server = NettyCatsServer[IO](
        NettyCatsServerOptions
          .default[IO](dispatcher)
          .prependInterceptor(
            CORSInterceptor.customOrThrow(
              CORSConfig.default.allowAllHeaders.allowAllMethods.allowAllOrigins
            )
          )
      )
      _ <-
        Resource.make {
          server
            .port(8080)
            .host("0.0.0.0")
            .addEndpoints(
              wishlist.AlbumWishlists.endpoints(wishlists) ++ album.Albums
                .endpoints(albums)
            )
            .start()
        } {
          _.stop()
        }

    } yield ()
}
