package guitargear.pedal

import java.time.LocalDate
import io.circe.Codec
import io.circe.derivation.Configuration
import io.circe.derivation.ConfiguredEnumCodec
import sttp.tapir.Schema

enum GuitarPedalCommand {
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

object GuitarPedalCommand {
  given Configuration = Configuration.default.withDiscriminator("type")
  given Codec[GuitarPedalCommand] = Codec.AsObject.derivedConfigured
  given Schema[GuitarPedalCommand] = Schema.derived
}

enum GuitarPedalEvent {
  case DescriptionUpdated(
      date: LocalDate,
      newDescription: String
  )
  case DescriptionRemoved(
      date: LocalDate
  )
}

object GuitarPedalEvent {
  given Configuration = Configuration.default.withDiscriminator("type")
  given Codec[GuitarPedalEvent] = Codec.AsObject.derivedConfigured
  given Schema[GuitarPedalEvent] = Schema.derived
}

final case class GuitarPedal(
    id: String,
    model: String,
    serialNumber: String,
    brand: GuitarPedalBrand,
    year: Int,
    `type`: PedalType,
    description: Option[String],
    events: Option[List[GuitarPedalEvent]]
) derives Codec.AsObject,
      Schema

extension (pedal: GuitarPedal) {
  def handle(command: GuitarPedalCommand): (GuitarPedalEvent, GuitarPedal) =
    command match {
      case GuitarPedalCommand.UpdateDescription(date, newDescription) =>
        val event = GuitarPedalEvent.DescriptionUpdated(date, newDescription)
        val updated = pedal.copy(
          description = Some(newDescription)
        )
        (event, updated)
      case GuitarPedalCommand.RemoveDescription(date) =>
        val event = GuitarPedalEvent.DescriptionRemoved(date)
        val updated = pedal.copy(
          description = None
        )
        (event, updated)
    }
}

enum GuitarPedalBrand {
  case Boss, WalrusAudio, EarthQuakerDevices, LichtlaermAudio, GroundFx, JHS,
    Revv,
    JPTRFX, SeymourDuncan, OldBloodNoiseEndeavors, Hologram, Digitech, Klirrton,
    WayHuge, TcElectronic, KMAMachines, ScienceAmplification, StoneDeaf, Fortin
}

object GuitarPedalBrand {
  given Configuration = Configuration.default
  given Codec[GuitarPedalBrand] = ConfiguredEnumCodec.derived
  given Schema[GuitarPedalBrand] =
    Schema.derivedEnumeration[GuitarPedalBrand]()
}

enum PedalType {
  case Distortion, Preamp, Overdrive, Fuzz, Delay, Reverb, NoiseGate, Chorus,
    Boost, PowerAmplifier, Tuner, Splitter
}

object PedalType {
  given Configuration = Configuration.default
  given Codec[PedalType] = ConfiguredEnumCodec.derived
  given Schema[PedalType] = Schema.derivedEnumeration[PedalType]()
}
