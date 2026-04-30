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

  // Unit weights (lbs/in) sourced from D'Addario's published tension chart.
  // NYXL plain steels and nickel-wound singles share the same per-gauge unit
  // weights as the regular PL/NW lines.
  val all: List[StringSpec] = List(
    StringSpec(7.0, 0.00001085, Plain),
    StringSpec(8.0, 0.00001418, Plain),
    StringSpec(8.5, 0.00001601, Plain),
    StringSpec(9.0, 0.00001794, Plain),
    StringSpec(9.5, 0.00001999, Plain),
    StringSpec(10.0, 0.00002215, Plain),
    StringSpec(10.5, 0.00002442, Plain),
    StringSpec(11.0, 0.0000268, Plain),
    StringSpec(11.5, 0.0000293, Plain),
    StringSpec(12.0, 0.0000319, Plain),
    StringSpec(13.0, 0.00003744, Plain),
    StringSpec(13.5, 0.00004037, Plain),
    StringSpec(14.0, 0.00004342, Plain),
    StringSpec(15.0, 0.00004984, Plain),
    StringSpec(16.0, 0.00005671, Plain),
    StringSpec(17.0, 0.00006402, Plain),
    StringSpec(18.0, 0.00007177, Plain),
    StringSpec(19.0, 0.00007997, Plain),
    StringSpec(20.0, 0.00008861, Plain),
    StringSpec(22.0, 0.00010722, Plain),
    StringSpec(24.0, 0.0001276, Plain),
    StringSpec(26.0, 0.00014975, Plain),
    StringSpec(17.0, 0.00005524, Wound),
    StringSpec(18.0, 0.00006215, Wound),
    StringSpec(19.0, 0.00006947, Wound),
    StringSpec(20.0, 0.00007495, Wound),
    StringSpec(21.0, 0.00008293, Wound),
    StringSpec(22.0, 0.00009184, Wound),
    StringSpec(24.0, 0.00010857, Wound),
    StringSpec(26.0, 0.00012671, Wound),
    StringSpec(28.0, 0.00014666, Wound),
    StringSpec(30.0, 0.00017236, Wound),
    StringSpec(32.0, 0.00019347, Wound),
    StringSpec(34.0, 0.0002159, Wound),
    StringSpec(36.0, 0.00023964, Wound),
    StringSpec(38.0, 0.00026471, Wound),
    StringSpec(39.0, 0.00027932, Wound),
    StringSpec(42.0, 0.00032279, Wound),
    StringSpec(44.0, 0.00035182, Wound),
    StringSpec(46.0, 0.00038216, Wound),
    StringSpec(48.0, 0.00041382, Wound),
    StringSpec(49.0, 0.00043014, Wound),
    StringSpec(52.0, 0.00048109, Wound),
    StringSpec(54.0, 0.00053838, Wound),
    StringSpec(56.0, 0.00057598, Wound),
    StringSpec(59.0, 0.00064191, Wound),
    StringSpec(60.0, 0.00066542, Wound),
    StringSpec(62.0, 0.00070697, Wound),
    StringSpec(64.0, 0.00074984, Wound),
    StringSpec(66.0, 0.00079889, Wound),
    StringSpec(68.0, 0.00084614, Wound),
    StringSpec(70.0, 0.00089304, Wound),
    StringSpec(72.0, 0.00094124, Wound),
    StringSpec(74.0, 0.00098869, Wound),
    StringSpec(80.0, 0.00115011, Wound)
  )
}
