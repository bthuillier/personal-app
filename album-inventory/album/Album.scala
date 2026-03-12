package album

import io.circe.Codec
import sttp.tapir.Schema
import java.time.LocalDate

final case class PartialAlbum(
    name: String,
    artist: String,
    format: AlbumFormat,
    releaseDate: LocalDate
) derives Codec.AsObject,
      Schema {
  
  val index: Char = artist.head.toLower

}

object PartialAlbum {

  def fromWishlist(wishlistAlbum: wishlist.WishlistAlbum): PartialAlbum =
    PartialAlbum(
      wishlistAlbum.name,
      wishlistAlbum.artist,
      wishlistAlbum.format,
      wishlistAlbum.releaseDate
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
