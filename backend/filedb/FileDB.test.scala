package filedb

import cats.effect.IO
import io.circe.{Decoder, Encoder}
import munit.CatsEffectSuite

import java.io.File
import java.nio.file.{Files, Path, Paths}

class FileDBTest extends CatsEffectSuite {

  case class Foo(id: String, name: String) derives Encoder.AsObject, Decoder

  private val tempDir: FunFixture[Path] = FunFixture[Path](
    setup = { _ => Files.createTempDirectory("filedb-test") },
    teardown = { dir =>
      def deleteRecursively(f: File): Unit = {
        if (f.isDirectory) Option(f.listFiles).toList.flatten.foreach(deleteRecursively)
        f.delete()
      }
      deleteRecursively(dir.toFile)
    }
  )

  private def newTable(root: Path): IO[FileTable[IO, Foo]] =
    for {
      engine <- FileDBEngine[IO](root, Paths.get("engine"))
      db <- engine.db("mydb")
      table <- db.table[Foo]("foos")
    } yield table

  tempDir.test("create writes an entity that get can read back") { root =>
    val foo = Foo("a", "first")
    for {
      table <- newTable(root)
      _ <- table.create("a", foo)
      got <- table.get("a")
    } yield assertEquals(got, foo)
  }

  tempDir.test("list returns all created entities") { root =>
    val a = Foo("a", "first")
    val b = Foo("b", "second")
    for {
      table <- newTable(root)
      _ <- table.create("a", a)
      _ <- table.create("b", b)
      all <- table.list
    } yield assertEquals(all.toSet, Set(a, b))
  }

  tempDir.test("list returns empty list on a fresh table") { root =>
    for {
      table <- newTable(root)
      all <- table.list
    } yield assertEquals(all, Nil)
  }

  tempDir.test("filter keeps only matching entities") { root =>
    val a = Foo("a", "alpha")
    val b = Foo("b", "beta")
    val c = Foo("c", "alpha")
    for {
      table <- newTable(root)
      _ <- table.create("a", a)
      _ <- table.create("b", b)
      _ <- table.create("c", c)
      matches <- table.filter(_.name == "alpha")
    } yield assertEquals(matches.toSet, Set(a, c))
  }

  tempDir.test("find returns the first matching entity") { root =>
    val a = Foo("a", "alpha")
    val b = Foo("b", "beta")
    for {
      table <- newTable(root)
      _ <- table.create("a", a)
      _ <- table.create("b", b)
      result <- table.find(_.name == "beta")
    } yield assertEquals(result, Some(b))
  }

  tempDir.test("find returns None when nothing matches") { root =>
    for {
      table <- newTable(root)
      _ <- table.create("a", Foo("a", "alpha"))
      result <- table.find(_.name == "missing")
    } yield assertEquals(result, None)
  }

  tempDir.test("delete removes the entity from the table") { root =>
    for {
      table <- newTable(root)
      _ <- table.create("a", Foo("a", "first"))
      _ <- table.delete("a")
      all <- table.list
    } yield assertEquals(all, Nil)
  }

  tempDir.test("update with updateF transforms the entity") { root =>
    for {
      table <- newTable(root)
      _ <- table.create("a", Foo("a", "first"))
      _ <- table.update("a", _.copy(name = "renamed"))
      got <- table.get("a")
    } yield assertEquals(got, Foo("a", "renamed"))
  }

  tempDir.test("update with entity replaces the stored value") { root =>
    val replacement = Foo("a", "replaced")
    for {
      table <- newTable(root)
      _ <- table.create("a", Foo("a", "first"))
      _ <- table.update("a", replacement)
      got <- table.get("a")
    } yield assertEquals(got, replacement)
  }

  tempDir.test("FileDB.tables lists existing table names") { root =>
    for {
      engine <- FileDBEngine[IO](root, Paths.get("engine"))
      db <- engine.db("mydb")
      _ <- db.table[Foo]("foos")
      _ <- db.table[Foo]("bars")
      tables <- db.tables
    } yield assertEquals(tables.toSet, Set("foos", "bars"))
  }

  tempDir.test("FileDBEngine.dbs lists existing db names") { root =>
    for {
      engine <- FileDBEngine[IO](root, Paths.get("engine"))
      _ <- engine.db("db1")
      _ <- engine.db("db2")
      dbs <- engine.dbs
    } yield assertEquals(dbs.toSet, Set("db1", "db2"))
  }
}
