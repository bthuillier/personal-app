package guitargear.pedal

case class GuitarPedalNotFoundException(pedalId: String)
    extends Exception(s"Guitar pedal with id $pedalId not found")

object Errors {
  def guitarPedalNotFound(pedalId: String): GuitarPedalNotFoundException =
    GuitarPedalNotFoundException(pedalId)
}
