package guitargear.guitar

case class GuitarNotFoundException(guitarId: String)
    extends Exception(s"Guitar with id $guitarId not found")

case class StringRecommendationException(message: String)
    extends Exception(message)

object Errors {
  def guitarNotFound(guitarId: String): GuitarNotFoundException =
    GuitarNotFoundException(guitarId)

  def stringRecommendationFailure(message: String): StringRecommendationException =
    StringRecommendationException(message)
}
