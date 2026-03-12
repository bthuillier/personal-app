package guitargear.amplifier

import io.circe.Codec
import io.circe.derivation.Configuration
import io.circe.derivation.ConfiguredEnumCodec
import sttp.tapir.Schema

final case class Amplifier(
    model: String,
    serialNumber: String,
    brand: AmplifierBrand,
    year: Int,
    wattage: Int,
    `type`: AmpType
) derives Codec.AsObject,
      Schema

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
