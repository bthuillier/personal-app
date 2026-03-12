package wishlist

import java.time.LocalDate
import io.circe.Codec
import sttp.tapir.Schema
import io.circe.derivation.ConfiguredEnumCodec
import io.circe.derivation.Configuration
import album.AlbumFormat

final case class WishlistAlbum(
    name: String,
    artist: String,
    format: AlbumFormat,
    releaseDate: LocalDate,
    status: WishlistStatus
) derives Codec.AsObject,
      Schema

enum WishlistStatus {
  case Wanted, Ordered, Received
}

object WishlistStatus {
  given Configuration = Configuration.default
  given Codec[WishlistStatus] = ConfiguredEnumCodec.derived
  given Schema[WishlistStatus] = Schema.derivedEnumeration[WishlistStatus]()
}
