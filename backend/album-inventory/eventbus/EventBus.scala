package eventbus

import cats.effect.IO
import fs2.concurrent.Topic
import org.typelevel.log4cats.Logger
import org.typelevel.log4cats.slf4j.Slf4jLogger

trait EventBus[E] {
  def publish(event: E): IO[Unit]
  def subscribe(handler: E => IO[Unit]): fs2.Stream[IO, Unit]
}

object EventBus {

  private class TopicEventBus[E](topic: Topic[IO, E], logger: Logger[IO])
      extends EventBus[E] {

    override def publish(event: E): IO[Unit] =
      topic.publish1(event) *> topic.subscribers
        .take(1)
        .compile
        .last
        .flatMap(x =>
          logger.debug(s"Published event to ${x.getOrElse(0)} subscribers")
        )

    override def subscribe(handler: E => IO[Unit]): fs2.Stream[IO, Unit] =
      topic.subscribeUnbounded.evalMap(handler)
  }

  def create[E]: IO[EventBus[E]] =
    for {
      logger <- Slf4jLogger.create[IO]
      topic <- Topic[IO, E]
    } yield TopicEventBus[E](topic, logger)
}
