package guitargear.strings

import guitargear.guitar.{Note, NoteName}

class RecommenderTest extends munit.FunSuite {

  private val standardE = List(
    Note(NoteName.E, 2),
    Note(NoteName.A, 2),
    Note(NoteName.D, 3),
    Note(NoteName.G, 3),
    Note(NoteName.B, 3),
    Note(NoteName.E, 4)
  )

  private val dStandard = List(
    Note(NoteName.D, 2),
    Note(NoteName.G, 2),
    Note(NoteName.C, 3),
    Note(NoteName.F, 3),
    Note(NoteName.A, 3),
    Note(NoteName.D, 4)
  )

  private val tenToFortySix = List(10.0, 13.0, 17.0, 26.0, 36.0, 46.0)

  private def recommendOrFail(
      referenceGauges: List[Double],
      referenceTuning: List[Note],
      targetTuning: List[Note]
  ): List[StringRecommendation] =
    Recommender
      .recommend(
        referenceGauges,
        referenceTuning,
        targetTuning,
        scaleLengthInches = 25.5,
        catalog = NyxlCatalog
      )
      .fold(err => fail(s"recommend returned Left: $err"), identity)

  test("identity: target = reference tuning recovers the same gauges") {
    val result = recommendOrFail(tenToFortySix, standardE, standardE)
    assertEquals(result.length, 6)
    assertEquals(
      result.map(_.spec.gauge),
      List(46.0, 36.0, 26.0, 17.0, 13.0, 10.0)
    )
    result.foreach { r =>
      assertEqualsDouble(r.deltaLbs, 0.0, 1e-9)
    }
  }

  test("lower tuning: D Standard suggests gauges no thinner than .010-.046") {
    val result = recommendOrFail(tenToFortySix, standardE, dStandard)
    assertEquals(result.length, 6)
    val recommendedHighToLow = result.map(_.spec.gauge).reverse
    val referenceHighToLow = tenToFortySix
    recommendedHighToLow.zip(referenceHighToLow).foreach { case (rec, ref) =>
      assert(
        rec >= ref,
        s"Expected recommended $rec >= reference $ref for lower tuning"
      )
    }
  }

  test("preserves plain-vs-wound boundary per string") {
    val result = recommendOrFail(tenToFortySix, standardE, dStandard)
    // Reference: low 3 are wound (.046, .036, .026), high 3 are plain (.017, .013, .010).
    // Output is low-pitch first, so first three should be wound, last three plain.
    val constructions = result.map(_.spec.construction)
    assertEquals(
      constructions,
      List(
        StringConstruction.Wound,
        StringConstruction.Wound,
        StringConstruction.Wound,
        StringConstruction.Plain,
        StringConstruction.Plain,
        StringConstruction.Plain
      )
    )
  }

  test("each recommendation lands within 2 lbs of the reference tension") {
    val result = recommendOrFail(tenToFortySix, standardE, dStandard)
    result.foreach { r =>
      assert(
        math.abs(r.deltaLbs) < 2.0,
        s"String ${r.note} delta ${r.deltaLbs} too large"
      )
    }
  }

  test("returns Left when target tuning size differs from reference") {
    val sevenString = standardE :+ Note(NoteName.B, 1)
    val result = Recommender.recommend(
      referenceGauges = tenToFortySix,
      referenceTuning = standardE,
      targetTuning = sevenString,
      scaleLengthInches = 25.5,
      catalog = NyxlCatalog
    )
    assert(result.isLeft)
  }

  test("returns Left when reference gauges don't match reference tuning size") {
    val result = Recommender.recommend(
      referenceGauges = List(10.0, 13.0, 17.0),
      referenceTuning = standardE,
      targetTuning = standardE,
      scaleLengthInches = 25.5,
      catalog = NyxlCatalog
    )
    assert(result.isLeft)
  }

  test("delta = recommended tension - reference tension") {
    val result = recommendOrFail(tenToFortySix, standardE, dStandard)
    result.foreach { r =>
      assertEqualsDouble(
        r.tensionLbs - r.referenceTensionLbs,
        r.deltaLbs,
        1e-9
      )
    }
  }
}
