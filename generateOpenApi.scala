import sttp.tapir.docs.openapi.OpenAPIDocsInterpreter
import sttp.apispec.openapi.circe.yaml.*
import java.nio.file.{Files, Paths}
import java.nio.charset.StandardCharsets

@main def generateOpenApi(): Unit = {
  val docs: String = OpenAPIDocsInterpreter()
    .toOpenAPI(
      wishlist.AlbumWishlists.endpointDefininitions ++
        album.Albums.endpointDefininitions ++
        guitargear.guitar.Guitars.endpointDefinitions ++
        guitargear.amplifier.AmplifierEndpoints.endpointDefinitions ++
        guitargear.pedal.GuitarPedals.endpointDefinitions,
      "Personal App API",
      "1.0"
    )
    .toYaml

  Files.write(Paths.get("openapi.yaml"), docs.getBytes(StandardCharsets.UTF_8))
}
