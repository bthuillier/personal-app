import guitar.*
import pedal.*
import sttp.tapir.server.netty.cats.NettyCatsServer
import cats.effect.ResourceApp
import cats.effect.{IO, Resource}
import sttp.tapir.server.netty.cats.NettyCatsServerOptions
import cats.effect.std.Dispatcher
import sttp.tapir.server.interceptor.cors.CORSInterceptor
import sttp.tapir.server.interceptor.cors.CORSConfig
import cats.effect.std.Env

object App extends ResourceApp.Forever {
  override def run(args: List[String]): Resource[IO, Unit] =
    for {
      basePath <- Resource.eval(Env[IO].get("DB_BASE_PATH").map(_.getOrElse("./db")))
      guitarService <- Resource.eval(
        GuitarService.fromFile(basePath)
      )
      ampService <- Resource.eval(
        amplifier.AmplifierService.fromFile(basePath)
      )
      pedalService <- Resource.eval(
        GuitarPedalService.fromFile(basePath)
      )
      dispatcher <- Dispatcher.parallel[IO]
      server = NettyCatsServer[IO](
        NettyCatsServerOptions
          .default[IO](dispatcher)
          .prependInterceptor(
            CORSInterceptor.customOrThrow(
              CORSConfig.default.allowAllHeaders.allowAllMethods.allowAllOrigins
            )
          )
      )
      _ <-
        Resource.make {
          server
            .port(8080)
            .host("0.0.0.0")
            .addEndpoints(
              Guitars.endpoints(guitarService) ++ amplifier.AmplifierEndpoints
                .endpoints(ampService) ++ GuitarPedals.endpoints(pedalService)
            )
            .start()
        } {
          _.stop()
        }

    } yield ()

  def displayGuitarsTable(guitars: List[Guitar]): Unit = {
    if (guitars.isEmpty) {
      println("No guitars found in inventory.")
      return
    }

    // Helper function to get tuning name or notes
    def getTuningDisplay(tuning: GuitarTuning): String = {
      // Check if it matches a known 6-string tuning
      val sixStringMatch =
        GuitarTuning.sixStringTunings.find(_._2 == tuning).map(_._1)
      if (sixStringMatch.isDefined) return sixStringMatch.get

      // Check if it matches a known 7-string tuning
      val sevenStringMatch =
        GuitarTuning.seventStringTuning.find(_._2 == tuning).map(_._1)
      if (sevenStringMatch.isDefined) return sevenStringMatch.get

      // Otherwise display the notes
      tuning.notes.toList.reverse
        .map(n => s"${n.name}${n.octave}")
        .mkString("-")
    }

    // Helper to truncate strings
    def truncate(str: String, maxLen: Int): String =
      if (str.length <= maxLen) str else str.take(maxLen - 1) + "…"

    // Calculate column widths
    val brandWidth = 12
    val modelWidth = 20
    val yearWidth = 6
    val stringsWidth = 7
    val tuningWidth = 15
    val pickupWidth = 20
    val serialWidth = 15

    // Print header
    println(
      "┌" + "─" * brandWidth + "┬" + "─" * modelWidth + "┬" + "─" * yearWidth +
        "┬" + "─" * stringsWidth + "┬" + "─" * tuningWidth +
        "┬" + "─" * pickupWidth + "┬" + "─" * serialWidth + "┐"
    )

    println(
      "│" + center("Brand", brandWidth) + "│" + center("Model", modelWidth) +
        "│" + center("Year", yearWidth) + "│" + center(
          "Strings",
          stringsWidth
        ) +
        "│" + center("Tuning", tuningWidth) + "│" + center(
          "Bridge Pickup",
          pickupWidth
        ) +
        "│" + center("Serial", serialWidth) + "│"
    )

    println(
      "├" + "─" * brandWidth + "┼" + "─" * modelWidth + "┼" + "─" * yearWidth +
        "┼" + "─" * stringsWidth + "┼" + "─" * tuningWidth +
        "┼" + "─" * pickupWidth + "┼" + "─" * serialWidth + "┤"
    )

    // Print guitar rows
    guitars.foreach { guitar =>
      val brand = truncate(guitar.brand.toString, brandWidth - 2)
      val model = truncate(guitar.model, modelWidth - 2)
      val year = guitar.year.toString
      val strings = s"${guitar.specifications.numberOfStrings}S"
      val tuning =
        truncate(getTuningDisplay(guitar.setup.tuning), tuningWidth - 2)
      val pickup = truncate(
        s"${guitar.specifications.pickupConfiguration.bridgePickup.brand} ${guitar.specifications.pickupConfiguration.bridgePickup.model}",
        pickupWidth - 2
      )
      val serial = truncate(guitar.serialNumber, serialWidth - 2)

      println(
        "│" + padRight(brand, brandWidth) + "│" + padRight(model, modelWidth) +
          "│" + center(year, yearWidth) + "│" + center(strings, stringsWidth) +
          "│" + padRight(tuning, tuningWidth) + "│" + padRight(
            pickup,
            pickupWidth
          ) +
          "│" + padRight(serial, serialWidth) + "│"
      )
    }

    // Print footer
    println(
      "└" + "─" * brandWidth + "┴" + "─" * modelWidth + "┴" + "─" * yearWidth +
        "┴" + "─" * stringsWidth + "┴" + "─" * tuningWidth +
        "┴" + "─" * pickupWidth + "┴" + "─" * serialWidth + "┘"
    )

    println(s"\nTotal guitars: ${guitars.length}")
  }

  def center(str: String, width: Int): String = {
    val padding = width - str.length
    val leftPad = padding / 2
    val rightPad = padding - leftPad
    " " * leftPad + str + " " * rightPad
  }

  def padRight(str: String, width: Int): String = {
    " " + str + " " * (width - str.length - 1)
  }

}
