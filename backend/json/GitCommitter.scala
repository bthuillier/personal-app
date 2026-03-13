package json

import cats.effect.IO
import cats.effect.std.Semaphore
import org.eclipse.jgit.api.Git
import org.eclipse.jgit.storage.file.FileRepositoryBuilder
import java.io.File
import java.nio.file.Path

class GitCommitter private (
    git: Git,
    repoRoot: Path,
    lock: Semaphore[IO]
) {

  /** Commits a specific file with the given message.
    * Operations are serialized via a semaphore to prevent concurrent git index access.
    */
  def commitFile(filePath: String, message: String): IO[Unit] =
    lock.permit.use { _ =>
      IO.blocking {
        val file = new File(filePath).getCanonicalFile
        val relativePath = repoRoot.relativize(file.toPath).toString

        git.add().addFilepattern(relativePath).call()

        val status = git.status().call()
        val hasChanges = !status.getChanged().isEmpty ||
          !status.getAdded().isEmpty

        if (hasChanges) {
          val commit = git.commit()
            .setMessage(message)
            .call()
          println(
            s"[GitCommitter] Committed ${commit.abbreviate(7).name()}: $message"
          )
        }
      }.adaptError { case e =>
        new RuntimeException(
          s"[GitCommitter] Failed to commit file: $filePath — ${e.getMessage}",
          e
        )
      }
    }
}

object GitCommitter {

  def create(basePath: String): IO[GitCommitter] =
    IO.blocking {
      val dbDir = new File(basePath).getCanonicalFile
      val repo = new FileRepositoryBuilder()
        .findGitDir(dbDir)
        .build()
      val git = new Git(repo)
      val repoRoot = repo.getWorkTree.toPath
      println(s"[GitCommitter] Initialized for repo: $repoRoot")
      (git, repoRoot)
    }.flatMap { case (git, repoRoot) =>
      Semaphore[IO](1).map(new GitCommitter(git, repoRoot, _))
    }
}
