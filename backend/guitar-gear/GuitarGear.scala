package guitargear

import cats.effect.IO
import sttp.tapir.server.ServerEndpoint
import guitargear.amplifier.*
import guitargear.guitar.*
import guitargear.pedal.*

object GuitarGear {

  private val db = "guitar-gear"

  def dbPath(basePath: String): String = s"$basePath/$db"
  
  def endpoints[F[_]](basePath: String): IO[List[ServerEndpoint[Any, IO]]] = for {
    guitarService <- GuitarService.fromFile(dbPath(basePath))
    ampService <- AmplifierService.fromFile(dbPath(basePath))
    pedalService <- GuitarPedalService.fromFile(dbPath(basePath))
  } yield
    Guitars.endpoints(guitarService) ++
      AmplifierEndpoints.endpoints(ampService) ++
      GuitarPedals.endpoints(pedalService)
  
}
