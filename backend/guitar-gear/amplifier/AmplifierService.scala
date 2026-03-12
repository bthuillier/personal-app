package guitargear.amplifier

import json.JsonLoader
import cats.effect.*

class AmplifierService(initialAmplifiers: List[Amplifier]) {

  private val amplifiers = initialAmplifiers.map { a =>
    a.serialNumber -> a
  }.toMap

  def list: List[Amplifier] = initialAmplifiers
  def find(serial: String): Option[Amplifier] = amplifiers.get(serial)
}

object AmplifierService {
  def fromFile(basePath: String): IO[AmplifierService] = {
    JsonLoader.loadJsonFolder[Amplifier](s"$basePath/guitar-amp").map { data =>
      new AmplifierService(data)
    }
  }
}
