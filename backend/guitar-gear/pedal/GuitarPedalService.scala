package guitargear.pedal

import json.JsonLoader
import cats.effect.*

class GuitarPedalService(initialPedals: List[GuitarPedal]) {

  private val pedals = initialPedals.map { g =>
    g.id -> g
  }.toMap

  def list: List[GuitarPedal] = initialPedals
  def find(id: String): Option[GuitarPedal] = pedals.get(id)

}

object GuitarPedalService {
  def fromFile(basePath: String): IO[GuitarPedalService] = {
    JsonLoader.loadJsonFolder[GuitarPedal](s"$basePath/guitar-pedal").map { data =>
      new GuitarPedalService(data)
    }
  }
}
