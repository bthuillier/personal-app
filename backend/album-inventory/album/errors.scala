package album

case class AlbumNotFoundException(albumId: String)
    extends Exception(s"Album with id $albumId not found")

object Errors {
  def albumNotFound(albumId: String): AlbumNotFoundException =
    AlbumNotFoundException(albumId)
}
