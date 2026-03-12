package guitargear.pedal

import json.JsonLoader
import cats.effect.*

class GuitarPedalService(initialPedals: List[GuitarPedal]) {

  private val guitars = initialPedals.map { g =>
    (g.serialNumber, g.brand) -> g
  }.toMap

  def list: List[GuitarPedal] = initialPedals
  def find(serial: String, brand: GuitarPedalBrand): Option[GuitarPedal] =
    guitars.get((serial, brand))

}

object GuitarPedalService {
  def fromFile(basePath: String): IO[GuitarPedalService] = {
    JsonLoader.loadJsonFolder[GuitarPedal](s"$basePath/guitar-pedal").map { data =>
      new GuitarPedalService(data)
    }
  }
}
