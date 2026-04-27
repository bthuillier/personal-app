package album

import io.circe.{Codec, Decoder, Encoder}
import sttp.tapir.Schema
import java.time.LocalDate
import sttp.tapir.integ.cats.codec.*
import cats.data.NonEmptySet

opaque type Rating = Int

object Rating {
  val Min: Int = 0
  val Max: Int = 10

  def from(value: Int): Either[InvalidRating, Rating] =
    if (value >= Min && value <= Max) Right(value)
    else Left(InvalidRating(value))

  def unsafe(value: Int): Rating = value

  extension (rating: Rating) def value: Int = rating

  given Encoder[Rating] = Encoder.encodeInt.contramap(_.value)
  given Decoder[Rating] = Decoder.decodeInt.emap { v =>
    from(v).left.map(_.getMessage)
  }
  given Schema[Rating] =
    Schema.schemaForInt.validate(sttp.tapir.Validator.inRange(Min, Max))
}

final case class InvalidRating(value: Int)
    extends Exception(
      s"Rating $value is out of range [${Rating.Min}, ${Rating.Max}]"
    )

final case class Review(
    rating: Rating,
    description: String
) derives Codec.AsObject,
      Schema

final case class PartialAlbum(
    id: String,
    name: String,
    artist: String,
    format: AlbumFormat,
    releaseDate: LocalDate,
    genre: Option[NonEmptySet[String]],
    review: Option[Review]
) derives Codec.AsObject,
      Schema {

  def addGenre(newGenre: String): PartialAlbum = {
    genre match {
      case Some(genres) => this.copy(genre = Some(genres.add(newGenre)))
      case None         => this.copy(genre = Some(NonEmptySet.one(newGenre)))
    }
  }

  def setReview(newReview: Review): PartialAlbum =
    this.copy(review = Some(newReview))

  def removeGenre(genreToRemove: String): PartialAlbum = {
    genre match {
      case Some(genres) =>
        this.copy(genre = NonEmptySet.fromSet(genres - genreToRemove))
      case None => this
    }
  }

}

object PartialAlbum {

  def fromWishlist(wishlistAlbum: wishlist.WishlistAlbum): PartialAlbum =
    PartialAlbum(
      wishlistAlbum.id,
      wishlistAlbum.name,
      wishlistAlbum.artist,
      wishlistAlbum.format,
      wishlistAlbum.releaseDate,
      None,
      None
    )

}

enum AlbumFormat {
  case Vinyl, CD
}

object AlbumFormat {
  import io.circe.derivation.{ConfiguredEnumCodec, Configuration}
  import io.circe.Codec
  import sttp.tapir.Schema

  given Configuration = Configuration.default
  given Codec[AlbumFormat] = ConfiguredEnumCodec.derived
  given Schema[AlbumFormat] = Schema.derivedEnumeration[AlbumFormat]()
}
