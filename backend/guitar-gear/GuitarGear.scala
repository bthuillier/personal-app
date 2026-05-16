package guitargear

import cats.effect.IO
import sttp.tapir.server.ServerEndpoint
import guitargear.amplifier.*
import guitargear.guitar.*
import guitargear.pedal.*
import json.GitCommitter
import filedb.FileDB

object GuitarGear {

  val dbName = "guitar-gear"

  def endpoints(
      db: FileDB[IO]
  )(using GitCommitter): IO[List[ServerEndpoint[Any, IO]]] = for {
    guitarService <- GuitarService.fromDB(db)
    ampService <- AmplifierService.fromDB(db)
    pedalService <- GuitarPedalService.fromDB(db)
  } yield Guitars.endpoints(guitarService) ++
    AmplifierEndpoints.endpoints(ampService) ++
    GuitarPedals.endpoints(pedalService)

}
