package guitargear.strings

import io.circe.Codec
import io.circe.derivation.Configuration
import io.circe.derivation.ConfiguredEnumCodec
import sttp.tapir.Schema

enum StringConstruction {
  case Plain, Wound
}

object StringConstruction {
  given Configuration = Configuration.default
  given Codec[StringConstruction] = ConfiguredEnumCodec.derived
  given Schema[StringConstruction] = Schema.derivedEnumeration[StringConstruction]()
}

enum StringBrand {
  case DAddarioNYXL
}

object StringBrand {
  given Configuration = Configuration.default
  given Codec[StringBrand] = ConfiguredEnumCodec.derived
  given Schema[StringBrand] = Schema.derivedEnumeration[StringBrand]()
}

final case class StringSpec(
    gauge: Double,
    unitWeight: Double,
    construction: StringConstruction
) derives Codec.AsObject,
      Schema

trait StringCatalog {
  def brand: StringBrand
  def all: List[StringSpec]
  def find(gauge: Double, construction: StringConstruction): Option[StringSpec] =
    all.find(s => s.gauge == gauge && s.construction == construction)
}

object NyxlCatalog extends StringCatalog {
  val brand: StringBrand = StringBrand.DAddarioNYXL

  import StringConstruction.*

  val all: List[StringSpec] = List(
    StringSpec(8.0, 0.0000179, Plain),
    StringSpec(8.5, 0.0000202, Plain),
    StringSpec(9.0, 0.0000226, Plain),
    StringSpec(9.5, 0.0000252, Plain),
    StringSpec(10.0, 0.0000279, Plain),
    StringSpec(10.5, 0.0000308, Plain),
    StringSpec(11.0, 0.0000338, Plain),
    StringSpec(11.5, 0.0000369, Plain),
    StringSpec(12.0, 0.0000402, Plain),
    StringSpec(13.0, 0.0000472, Plain),
    StringSpec(14.0, 0.0000548, Plain),
    StringSpec(15.0, 0.0000628, Plain),
    StringSpec(16.0, 0.0000714, Plain),
    StringSpec(17.0, 0.0000807, Plain),
    StringSpec(18.0, 0.0000905, Plain),
    StringSpec(19.0, 0.0001009, Plain),
    StringSpec(20.0, 0.0001119, Plain),
    StringSpec(22.0, 0.0001354, Plain),
    StringSpec(20.0, 0.0001352, Wound),
    StringSpec(22.0, 0.0001705, Wound),
    StringSpec(24.0, 0.0002034, Wound),
    StringSpec(26.0, 0.0002321, Wound),
    StringSpec(28.0, 0.0002647, Wound),
    StringSpec(30.0, 0.0003056, Wound),
    StringSpec(32.0, 0.0003535, Wound),
    StringSpec(34.0, 0.0004003, Wound),
    StringSpec(36.0, 0.0004534, Wound),
    StringSpec(38.0, 0.0005178, Wound),
    StringSpec(42.0, 0.0006207, Wound),
    StringSpec(44.0, 0.0006784, Wound),
    StringSpec(46.0, 0.0007409, Wound),
    StringSpec(48.0, 0.0008178, Wound),
    StringSpec(49.0, 0.0008599, Wound),
    StringSpec(50.0, 0.0009017, Wound),
    StringSpec(52.0, 0.0009711, Wound),
    StringSpec(54.0, 0.0010623, Wound),
    StringSpec(56.0, 0.0011423, Wound),
    StringSpec(58.0, 0.0012256, Wound),
    StringSpec(59.0, 0.0012671, Wound),
    StringSpec(60.0, 0.0013092, Wound),
    StringSpec(62.0, 0.0013939, Wound),
    StringSpec(64.0, 0.0014853, Wound),
    StringSpec(65.0, 0.0015342, Wound),
    StringSpec(66.0, 0.0015795, Wound),
    StringSpec(68.0, 0.0016809, Wound),
    StringSpec(70.0, 0.0017733, Wound),
    StringSpec(72.0, 0.0018689, Wound),
    StringSpec(74.0, 0.0019735, Wound),
    StringSpec(80.0, 0.0023361, Wound)
  )
}
