package guitargear.amplifier

import java.time.LocalDate
import io.circe.Codec
import io.circe.derivation.Configuration
import io.circe.derivation.ConfiguredEnumCodec
import sttp.tapir.Schema

enum AmplifierCommand {
  case UpdateDescription(
      date: LocalDate,
      newDescription: String
  )
  case RemoveDescription(
      date: LocalDate
  )

  def dateOfEvent = this match {
    case UpdateDescription(date, _) => date
    case RemoveDescription(date) => date
  }
}

object AmplifierCommand {
  given Configuration = Configuration.default.withDiscriminator("type")
  given Codec[AmplifierCommand] = Codec.AsObject.derivedConfigured
  given Schema[AmplifierCommand] = Schema.derived
}

enum AmplifierEvent {
  case DescriptionUpdated(
      date: LocalDate,
      newDescription: String
  )
  case DescriptionRemoved(
      date: LocalDate
  )
}

object AmplifierEvent {
  given Configuration = Configuration.default.withDiscriminator("type")
  given Codec[AmplifierEvent] = Codec.AsObject.derivedConfigured
  given Schema[AmplifierEvent] = Schema.derived
}

final case class Amplifier(
    id: String,
    model: String,
    serialNumber: String,
    brand: AmplifierBrand,
    year: Int,
    wattage: Int,
    `type`: AmpType,
    description: Option[String],
    events: Option[List[AmplifierEvent]]
) derives Codec.AsObject,
      Schema

extension (amplifier: Amplifier) {
  def handle(command: AmplifierCommand): (AmplifierEvent, Amplifier) =
    command match {
      case AmplifierCommand.UpdateDescription(date, newDescription) =>
        val event = AmplifierEvent.DescriptionUpdated(date, newDescription)
        val updated = amplifier.copy(
          description = Some(newDescription)
        )
        (event, updated)
      case AmplifierCommand.RemoveDescription(date) =>
        val event = AmplifierEvent.DescriptionRemoved(date)
        val updated = amplifier.copy(
          description = None
        )
        (event, updated)
    }
}

enum AmplifierBrand {
  case Victory, Revv
}

object AmplifierBrand {
  given Configuration = Configuration.default
  given Codec[AmplifierBrand] = ConfiguredEnumCodec.derived
  given Schema[AmplifierBrand] = Schema.derivedEnumeration[AmplifierBrand]()
}

enum AmpType {
  case Tube, SolidState
}

object AmpType {
  given Configuration = Configuration.default
  given Codec[AmpType] = ConfiguredEnumCodec.derived
  given Schema[AmpType] = Schema.derivedEnumeration[AmpType]()
}
