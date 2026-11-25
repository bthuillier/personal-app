package album

case class AlbumNotFoundException(albumId: String)
    extends Exception(s"Album with id $albumId not found")

case class AlbumAlreadyExistsException(
    name: String,
    artist: String,
    format: AlbumFormat
) extends Exception(
      s"Album '$name' by $artist already exists in $format format"
    )

object Errors {
  def albumNotFound(albumId: String): AlbumNotFoundException =
    AlbumNotFoundException(albumId)
}
