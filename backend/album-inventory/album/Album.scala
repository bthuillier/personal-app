package album

import io.circe.Codec
import sttp.tapir.Schema
import java.time.LocalDate
import sttp.tapir.integ.cats.codec.*
import cats.data.NonEmptySet

final case class PartialAlbum(
    id: String,
    name: String,
    artist: String,
    format: AlbumFormat,
    releaseDate: LocalDate,
    genre: Option[NonEmptySet[String]]
) derives Codec.AsObject,
      Schema {

  def addGenre(newGenre: String): PartialAlbum = {
    genre match {
      case Some(genres) => this.copy(genre = Some(genres.add(newGenre)))
      case None         => this.copy(genre = Some(NonEmptySet.one(newGenre)))
    }
  }

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
