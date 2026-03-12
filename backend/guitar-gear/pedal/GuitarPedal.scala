package guitargear.pedal

import io.circe.Codec
import io.circe.derivation.Configuration
import io.circe.derivation.ConfiguredEnumCodec
import sttp.tapir.Schema

final case class GuitarPedal(
    model: String,
    serialNumber: String,
    brand: GuitarPedalBrand,
    year: Int,
    `type`: PedalType
) derives Codec.AsObject,
      Schema

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
