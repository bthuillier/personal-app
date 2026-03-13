//> using scala 3.7.4
//> using options --deprecation --explain -Wunused:all -source 3.0

// cats
//> using dependency org.typelevel::cats-core:2.13.0
//> using dependency org.typelevel::cats-effect:3.7.0

//fs2
//> using dependency co.fs2::fs2-core:3.13.0

// json
//> using dependency io.circe::circe-core:0.14.15
//> using dependency io.circe::circe-parser:0.14.15

// tapir for api
//> using dependency com.softwaremill.sttp.tapir::tapir-core:1.13.11
//> using dependency com.softwaremill.sttp.tapir::tapir-cats:1.13.11
//> using dependency com.softwaremill.sttp.tapir::tapir-json-circe:1.13.11
//> using dependency com.softwaremill.sttp.tapir::tapir-netty-server-cats:1.13.11
//> using dependency com.softwaremill.sttp.tapir::tapir-openapi-docs:1.13.11

//> using dependency com.softwaremill.sttp.apispec::openapi-circe-yaml:0.11.10

// logging
//> using dependency org.typelevel::log4cats-core:2.8.0
//> using dependency org.typelevel::log4cats-slf4j:2.8.0
//> using dependency org.slf4j:slf4j-api:2.0.17
//> using dependency org.slf4j:slf4j-simple:2.0.17

// git
//> using dependency org.eclipse.jgit:org.eclipse.jgit:7.2.0.202503040940-r

// test
//> using test.dep org.scalameta::munit::1.2.4
//> using test.dep org.typelevel::munit-cats-effect:2.2.0
