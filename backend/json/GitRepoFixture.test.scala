package json

import munit.CatsEffectSuite

import java.io.File
import java.nio.file.{Files, Path}

trait GitRepoFixture { self: CatsEffectSuite =>

  protected def tempRepoPrefix: String = "git-repo-test"

  protected val tempRepo: FunFixture[Path] = FunFixture[Path](
    setup = { _ =>
      val dir = Files.createTempDirectory(tempRepoPrefix)
      org.eclipse.jgit.api.Git.init().setDirectory(dir.toFile).call().close()
      dir
    },
    teardown = { dir =>
      def deleteRecursively(f: File): Unit = {
        if (f.isDirectory)
          Option(f.listFiles).toList.flatten.foreach(deleteRecursively)
        f.delete()
      }
      deleteRecursively(dir.toFile)
    }
  )
}
