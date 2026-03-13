package guitargear.guitar

import java.time.LocalDate
import io.circe.Codec
import sttp.tapir.Schema
import io.circe.derivation.ConfiguredEnumCodec
import io.circe.derivation.Configuration
import scala.collection.immutable.SortedSet
// Commands

enum GuitarCommand {
  case ChangeStrings(
      date: LocalDate,
      stringBrand: String,
      stringGauge: List[Double],
      tuning: GuitarTuning
  )
}

object GuitarCommand {
  given Configuration = Configuration.default.withDiscriminator("type")
  given Codec[GuitarCommand] = Codec.AsObject.derivedConfigured
  given Schema[GuitarCommand] = Schema.derived
}

// Events

enum GuitarEvent {
  case StringsChanged(
      date: LocalDate,
      stringBrand: String,
      stringGauge: List[Double],
      tuning: GuitarTuning
  )
}

object GuitarEvent {
  given Configuration = Configuration.default.withDiscriminator("type")
  given Codec[GuitarEvent] = Codec.AsObject.derivedConfigured
  given Schema[GuitarEvent] = Schema.derived
}

final case class Guitar(
    id: String,
    model: String,
    brand: GuitarBrand,
    year: Int,
    serialNumber: String,
    specifications: GuitarSpecifications,
    setup: GuitarSetup,
    events: Option[List[GuitarEvent]]
) derives Codec.AsObject,
      Schema

extension (guitar: Guitar) {
  def handle(command: GuitarCommand): (GuitarEvent, Guitar) = command match {
    case GuitarCommand.ChangeStrings(date, brand, gauge, tuning) =>
      val event = GuitarEvent.StringsChanged(date, brand, gauge, tuning)
      val updated = guitar.copy(
        setup = guitar.setup.copy(
          stringBrand = brand,
          stringGauge = gauge,
          tuning = tuning,
          lastStringChange = date
        )
      )
      (event, updated)
  }
}

final case class GuitarSetup(
    stringGauge: List[Double],
    stringBrand: String,
    tuning: GuitarTuning,
    lastStringChange: LocalDate
) derives Codec.AsObject,
      Schema

final case class GuitarTuning(
    notes: SortedSet[Note]
) derives Codec.AsObject,
      Schema

object GuitarTuning {
  val sixStringTunings: Map[String, GuitarTuning] = Map(
    "Standard E" -> GuitarTuning(
      SortedSet(
        Note(NoteName.E, 4),
        Note(NoteName.B, 3),
        Note(NoteName.G, 3),
        Note(NoteName.D, 3),
        Note(NoteName.A, 2),
        Note(NoteName.E, 2)
      )
    ),
    "Drop D" -> GuitarTuning(
      SortedSet(
        Note(NoteName.E, 4),
        Note(NoteName.B, 3),
        Note(NoteName.G, 3),
        Note(NoteName.D, 3),
        Note(NoteName.A, 2),
        Note(NoteName.D, 2)
      )
    ),
    "D Standard" -> GuitarTuning(
      SortedSet(
        Note(NoteName.D, 4),
        Note(NoteName.A, 3),
        Note(NoteName.F, 3),
        Note(NoteName.C, 3),
        Note(NoteName.G, 2),
        Note(NoteName.D, 2)
      )
    ),
    "C Standard" -> GuitarTuning(
      SortedSet(
        Note(NoteName.C, 4),
        Note(NoteName.G, 3),
        Note(NoteName.Ds, 3),
        Note(NoteName.As, 2),
        Note(NoteName.F, 2),
        Note(NoteName.C, 2)
      )
    ),
    "Drop C" -> GuitarTuning(
      SortedSet(
        Note(NoteName.D, 4),
        Note(NoteName.A, 3),
        Note(NoteName.F, 3),
        Note(NoteName.C, 3),
        Note(NoteName.G, 2),
        Note(NoteName.C, 2)
      )
    )
  )

  val seventStringTuning = Map(
    "Standard B" -> GuitarTuning(
      SortedSet(
        Note(NoteName.E, 4),
        Note(NoteName.B, 3),
        Note(NoteName.G, 3),
        Note(NoteName.D, 3),
        Note(NoteName.A, 2),
        Note(NoteName.E, 2),
        Note(NoteName.B, 1)
      )
    ),
    "Drop A" -> GuitarTuning(
      SortedSet(
        Note(NoteName.E, 4),
        Note(NoteName.B, 3),
        Note(NoteName.G, 3),
        Note(NoteName.D, 3),
        Note(NoteName.A, 2),
        Note(NoteName.E, 2),
        Note(NoteName.A, 1)
      )
    ),
    "Drop G" -> GuitarTuning(
      SortedSet(
        Note(NoteName.D, 4),
        Note(NoteName.A, 3),
        Note(NoteName.F, 3),
        Note(NoteName.C, 3),
        Note(NoteName.G, 2),
        Note(NoteName.D, 2),
        Note(NoteName.G, 1)
      )
    )
  )

}

final case class Note(
    name: NoteName,
    octave: Int
) derives Codec.AsObject,
      Schema

object Note {
  given Ordering[Note] = Ordering.by(n => (n.octave, n.name))
}

final case class GuitarSpecifications(
    bodyFinish: String,
    top: Option[GuitarMaterial],
    bodyMaterial: GuitarMaterial,
    pickupConfiguration: PickupConfiguration,
    fretboardMaterial: GuitarMaterial,
    neckMaterial: List[GuitarMaterial],
    numberOfFrets: Int,
    scaleLengthInInches: Double,
    numberOfStrings: Int
) derives Codec.AsObject,
      Schema

final case class PickupConfiguration(
    neckPickup: Option[Pickup],
    middlePickup: Option[Pickup],
    bridgePickup: Pickup
) derives Codec.AsObject,
      Schema

final case class Pickup(
    `type`: PickupType,
    brand: PickupBrand,
    model: String
) derives Codec.AsObject,
      Schema

enum PickupType {
  case SingleCoil, Humbucker, P90
}

object PickupType {
  given Configuration = Configuration.default
  given Codec[PickupType] = ConfiguredEnumCodec.derived

  given Schema[PickupType] = Schema.derivedEnumeration[PickupType]()
}

enum PickupBrand {
  case SeymourDuncan, DiMarzio, EMG, Dunable, Fishman, Lundgren, BareKnuckle
}

object PickupBrand {
  given Configuration = Configuration.default
  given Codec[PickupBrand] = ConfiguredEnumCodec.derived
  given Schema[PickupBrand] = Schema.derivedEnumeration[PickupBrand]()
}

enum GuitarBrand {
  case Dunable, Aristides, Ltd, Epiphone, Schecter, Ibanez, Jackson, Charvel, PRS
}

object GuitarBrand {
  given Configuration = Configuration.default
  given Codec[GuitarBrand] = ConfiguredEnumCodec.derived
  given Schema[GuitarBrand] = Schema.derivedEnumeration[GuitarBrand]()
}

enum NoteName {
  case C, Cs, D, Ds, E, F, Fs, G, Gs, A, As, B
}

object NoteName {
  given Configuration = Configuration.default
  given Codec[NoteName] = ConfiguredEnumCodec.derived
  given Schema[NoteName] = Schema.derivedEnumeration[NoteName]()
  given Ordering[NoteName] = Ordering.by {
    case C  => 0
    case Cs => 1
    case D  => 2
    case Ds => 3
    case E  => 4
    case F  => 5
    case Fs => 6
    case G  => 7
    case Gs => 8
    case A  => 9
    case As => 10
    case B  => 11
  }
}

enum GuitarMaterial {
  case Mahogany, Alder, Ash, Basswood, Maple, Rosewood, MacassarEbony, Ebony,
    PauFerro, RoastedMaple, RichLite, Arium, QuiltedMaple, SwampAsh, PoplarBurl,
    FlamedMaple, Wenge, PurpleHeart, Walnut, Mango
}

object GuitarMaterial {
  given Configuration = Configuration.default
  given Codec[GuitarMaterial] = ConfiguredEnumCodec.derived
  given Schema[GuitarMaterial] = Schema.derivedEnumeration[GuitarMaterial]()
}
