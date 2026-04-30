package guitargear.strings

import cats.syntax.traverse.*
import guitargear.guitar.{Note, NoteName}

object Tension {

  private val GravitationalConstant = 386.4

  def frequency(note: Note): Double = {
    val midi = (note.octave + 1) * 12 + semitoneOffset(note.name)
    440.0 * math.pow(2.0, (midi - 69) / 12.0)
  }

  def compute(unitWeight: Double, note: Note, scaleLengthInches: Double): Double = {
    val f = frequency(note)
    val numerator = unitWeight * math.pow(2.0 * scaleLengthInches * f, 2)
    numerator / GravitationalConstant
  }

  def forSpec(spec: StringSpec, note: Note, scaleLengthInches: Double): Double =
    compute(spec.unitWeight, note, scaleLengthInches)

  def forGauge(
      gauge: Double,
      construction: StringConstruction,
      note: Note,
      scaleLengthInches: Double,
      catalog: StringCatalog
  ): Either[String, Double] =
    catalog
      .find(gauge, construction)
      .toRight(s"Gauge $gauge ($construction) not found in ${catalog.brand} catalog")
      .map(forSpec(_, note, scaleLengthInches))

  /**
   * Per-string tensions for a setup, ordered low-pitch → high-pitch.
   *
   * `gauges` is the user-stored list (thin → thick, high → low pitch); it is
   * reversed to align with the tuning's ascending ordering. Plain-vs-wound is
   * inferred by position: the 3 thinnest strings are plain, the rest are
   * wound — the standard D'Addario electric guitar set convention.
   */
  def forSetup(
      gauges: List[Double],
      tuning: List[Note],
      scaleLengthInches: Double,
      catalog: StringCatalog
  ): Either[String, List[StringTension]] =
    if (gauges.length != tuning.length)
      Left(
        s"Gauge count (${gauges.length}) does not match tuning size (${tuning.length})"
      )
    else {
      val n = gauges.length
      tuning.zip(gauges.reverse).zipWithIndex.traverse { case ((note, gauge), idx) =>
        val construction = inferConstruction(idx, n)
        resolveSpec(gauge, construction, catalog).map { spec =>
          StringTension(note, spec, forSpec(spec, note, scaleLengthInches))
        }
      }
    }

  /**
   * Aligned with the tuning's low-pitch-first ordering: the last 3 entries
   * (the thinnest strings) are plain; everything thicker is wound.
   */
  private def inferConstruction(
      indexLowPitchFirst: Int,
      totalStrings: Int
  ): StringConstruction =
    if (indexLowPitchFirst >= totalStrings - 3) StringConstruction.Plain
    else StringConstruction.Wound

  private def resolveSpec(
      gauge: Double,
      construction: StringConstruction,
      catalog: StringCatalog
  ): Either[String, StringSpec] =
    catalog
      .find(gauge, construction)
      .orElse(catalog.all.find(_.gauge == gauge))
      .toRight(s"Gauge $gauge not found in ${catalog.brand} catalog")

  private def semitoneOffset(name: NoteName): Int = name match {
    case NoteName.C => 0
    case NoteName.Cs => 1
    case NoteName.D => 2
    case NoteName.Ds => 3
    case NoteName.E => 4
    case NoteName.F => 5
    case NoteName.Fs => 6
    case NoteName.G => 7
    case NoteName.Gs => 8
    case NoteName.A => 9
    case NoteName.As => 10
    case NoteName.B => 11
  }

}

final case class StringTension(
    note: Note,
    spec: StringSpec,
    tensionLbs: Double
)
