package guitargear.strings

import guitargear.guitar.{Note, NoteName}

class TensionTest extends munit.FunSuite {

  private val Tolerance = 1e-6

  test("frequency: A4 = 440 Hz exactly") {
    assertEqualsDouble(Tension.frequency(Note(NoteName.A, 4)), 440.0, Tolerance)
  }

  test("frequency: A5 = 880 Hz (one octave up doubles)") {
    assertEqualsDouble(Tension.frequency(Note(NoteName.A, 5)), 880.0, Tolerance)
  }

  test("frequency: A3 = 220 Hz (one octave down halves)") {
    assertEqualsDouble(Tension.frequency(Note(NoteName.A, 3)), 220.0, Tolerance)
  }

  test("frequency: E2 ≈ 82.407 Hz (low E)") {
    assertEqualsDouble(Tension.frequency(Note(NoteName.E, 2)), 82.4068892282175, 1e-9)
  }

  test("frequency: E4 ≈ 329.628 Hz (high E)") {
    assertEqualsDouble(Tension.frequency(Note(NoteName.E, 4)), 329.6275569128699, 1e-9)
  }

  test("compute: tension matches T = UW * (2*L*f)^2 / 386.4") {
    val uw = 0.000028
    val scale = 25.5
    val note = Note(NoteName.E, 4)
    val f = Tension.frequency(note)
    val expected = uw * math.pow(2 * scale * f, 2) / 386.4
    assertEqualsDouble(Tension.compute(uw, note, scale), expected, Tolerance)
  }

  test("compute: doubling unit weight doubles tension") {
    val note = Note(NoteName.A, 4)
    val a = Tension.compute(0.0001, note, 25.5)
    val b = Tension.compute(0.0002, note, 25.5)
    assertEqualsDouble(b / a, 2.0, Tolerance)
  }

  test("compute: octave up (frequency doubles) quadruples tension") {
    val a = Tension.compute(0.0001, Note(NoteName.A, 3), 25.5)
    val b = Tension.compute(0.0001, Note(NoteName.A, 4), 25.5)
    assertEqualsDouble(b / a, 4.0, Tolerance)
  }

  test("compute: doubling scale length quadruples tension") {
    val note = Note(NoteName.A, 4)
    val a = Tension.compute(0.0001, note, 12.75)
    val b = Tension.compute(0.0001, note, 25.5)
    assertEqualsDouble(b / a, 4.0, Tolerance)
  }

  test("forGauge: returns Right with tension when gauge exists in catalog") {
    val result = Tension.forGauge(10.0, Note(NoteName.E, 4), 25.5, NyxlCatalog)
    assert(result.isRight)
  }

  test("forGauge: returns Left when gauge is not in catalog") {
    val result = Tension.forGauge(99.5, Note(NoteName.E, 4), 25.5, NyxlCatalog)
    assert(result.isLeft)
  }

  test("forGauge: ambiguous gauge .020 resolves to wound (low note context)") {
    val tWound = Tension.forSpec(
      NyxlCatalog.find(20.0, StringConstruction.Wound).get,
      Note(NoteName.D, 3),
      25.5
    )
    val tFromGauge =
      Tension.forGauge(20.0, Note(NoteName.D, 3), 25.5, NyxlCatalog).toOption.get
    assertEqualsDouble(tFromGauge, tWound, Tolerance)
  }

  // Sanity-checks against D'Addario's published tension chart, for a 25.5"
  // scale. If any of these fail, the catalog unit weights have drifted from
  // the source.
  test("catalog: PL010 at E4 / 25.5\" ≈ 16.2 lbs (D'Addario published)") {
    val t = Tension.forGauge(10.0, Note(NoteName.E, 4), 25.5, NyxlCatalog)
    assertEqualsDouble(t.toOption.get, 16.2, 0.1)
  }

  test("catalog: NW046 at E2 / 25.5\" ≈ 17.5 lbs (D'Addario published)") {
    val t = Tension.forGauge(46.0, Note(NoteName.E, 2), 25.5, NyxlCatalog)
    assertEqualsDouble(t.toOption.get, 17.5, 0.1)
  }

  test("catalog: NW052 at A1 / 25.5\" wound resolves and produces a tension") {
    val t = Tension.forGauge(52.0, Note(NoteName.A, 1), 25.5, NyxlCatalog)
    assert(t.isRight)
  }

  test("forSetup: Standard E with .010-.046 returns 6 tensions, low-pitch first") {
    val tuning = List(
      Note(NoteName.E, 2),
      Note(NoteName.A, 2),
      Note(NoteName.D, 3),
      Note(NoteName.G, 3),
      Note(NoteName.B, 3),
      Note(NoteName.E, 4)
    )
    val gauges = List(10.0, 13.0, 17.0, 26.0, 36.0, 46.0)
    val Right(result) = Tension.forSetup(gauges, tuning, 25.5, NyxlCatalog): @unchecked
    assertEquals(result.length, 6)
    assertEquals(result.map(_.note), tuning)
    assertEquals(result.head.spec.gauge, 46.0) // .046 is the low-E (thickest) string
    assertEquals(result.last.spec.gauge, 10.0) // .010 is the high-E string
  }

  test("forSetup: returns Left when gauge count mismatches tuning length") {
    val tuning = List(Note(NoteName.E, 2), Note(NoteName.A, 2))
    val gauges = List(10.0, 13.0, 17.0)
    val result = Tension.forSetup(gauges, tuning, 25.5, NyxlCatalog)
    assert(result.isLeft)
  }

  test("forSetup: returns Left when any gauge is missing from the catalog") {
    val tuning = List(Note(NoteName.E, 2))
    val gauges = List(99.5)
    val result = Tension.forSetup(gauges, tuning, 25.5, NyxlCatalog)
    assert(result.isLeft)
  }
}
