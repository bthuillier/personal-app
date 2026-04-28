package json

import cats.effect.IO
import cats.effect.std.Semaphore
import org.eclipse.jgit.api.Git
import org.eclipse.jgit.storage.file.FileRepositoryBuilder
import org.typelevel.log4cats.Logger
import org.typelevel.log4cats.slf4j.Slf4jLogger
import java.io.File
import java.nio.file.Path

class GitCommitter private (
    git: Git,
    repoRoot: Path,
    lock: Semaphore[IO],
    logger: Logger[IO]
) {

  /**
   * Commits a specific file with the given message. Operations are serialized
   * via a semaphore to prevent concurrent git index access.
   */
  def commitFile(filePath: String, message: String): IO[Unit] =
    lock.permit.use { _ =>
      IO.blocking {
        val file = new File(filePath).getCanonicalFile
        val relativePath = repoRoot.relativize(file.toPath).toString

        git.add().addFilepattern(relativePath).call()

        val status = git.status().call()
        val hasChanges = !status.getChanged().isEmpty ||
          !status.getAdded().isEmpty ||
          !status.getRemoved().isEmpty

        if (hasChanges) {
          val commit = git
            .commit()
            .setMessage(message)
            .call()
          (true, commit.abbreviate(7).name(), message)
        } else {
          (false, "", "")
        }
      }.flatMap { case (committed, shortId, msg) =>
        if (committed) logger.info(s"Committed $shortId: $msg")
        else IO.unit
      }.adaptError { case e =>
        new RuntimeException(
          s"Failed to commit file: $filePath — ${e.getMessage}",
          e
        )
      }
    }
}

object GitCommitter {

  def create(basePath: String): IO[GitCommitter] =
    for {
      logger <- Slf4jLogger.create[IO]
      result <- IO.blocking {
        val dbDir = new File(basePath).getCanonicalFile
        val repo = new FileRepositoryBuilder()
          .findGitDir(dbDir)
          .build()
        val git = new Git(repo)
        val repoRoot = repo.getWorkTree.toPath
        (git, repoRoot)
      }
      (git, repoRoot) = result
      _ <- logger.info(s"Initialized for repo: $repoRoot")
      lock <- Semaphore[IO](1)
    } yield new GitCommitter(git, repoRoot, lock, logger)
}
