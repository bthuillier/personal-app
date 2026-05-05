package guitargear.amplifier

case class AmplifierNotFoundException(amplifierId: String)
    extends Exception(s"Amplifier with id $amplifierId not found")

object Errors {
  def amplifierNotFound(amplifierId: String): AmplifierNotFoundException =
    AmplifierNotFoundException(amplifierId)
}
