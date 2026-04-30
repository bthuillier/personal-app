package guitargear.strings

import cats.syntax.traverse.*
import guitargear.guitar.Note

final case class StringRecommendation(
    note: Note,
    spec: StringSpec,
    tensionLbs: Double,
    referenceTensionLbs: Double,
    deltaLbs: Double
)

object Recommender {

  /**
   * Recommend gauges for `targetTuning` that best reproduce the per-string
   * tension profile of the reference setup.
   *
   * Plain-vs-wound is preserved per string: if the reference's low E is
   * wound, the corresponding target string is also picked from wound gauges.
   *
   * Returns Left if the gauge/tuning lengths don't line up, the target
   * tuning has a different string count than the reference, or any
   * reference gauge is missing from the catalog.
   */
  def recommend(
      referenceGauges: List[Double],
      referenceTuning: List[Note],
      targetTuning: List[Note],
      scaleLengthInches: Double,
      catalog: StringCatalog
  ): Either[String, List[StringRecommendation]] =
    if (referenceTuning.length != targetTuning.length)
      Left(
        s"Target tuning size (${targetTuning.length}) does not match " +
          s"reference tuning size (${referenceTuning.length})"
      )
    else
      Tension
        .forSetup(referenceGauges, referenceTuning, scaleLengthInches, catalog)
        .flatMap { reference =>
          reference.zip(targetTuning).traverse { case (refString, targetNote) =>
            pickClosest(
              refString.spec.construction,
              targetNote,
              refString.tensionLbs,
              scaleLengthInches,
              catalog
            ).map { picked =>
              val tension = Tension.forSpec(picked, targetNote, scaleLengthInches)
              StringRecommendation(
                note = targetNote,
                spec = picked,
                tensionLbs = tension,
                referenceTensionLbs = refString.tensionLbs,
                deltaLbs = tension - refString.tensionLbs
              )
            }
          }
        }

  private def pickClosest(
      construction: StringConstruction,
      note: Note,
      referenceTensionLbs: Double,
      scaleLengthInches: Double,
      catalog: StringCatalog
  ): Either[String, StringSpec] = {
    val candidates = catalog.all.filter(_.construction == construction)
    if (candidates.isEmpty)
      Left(
        s"No $construction strings in ${catalog.brand} catalog"
      )
    else
      Right(
        candidates.minBy { spec =>
          math.abs(
            Tension.forSpec(spec, note, scaleLengthInches) - referenceTensionLbs
          )
        }
      )
  }
}
