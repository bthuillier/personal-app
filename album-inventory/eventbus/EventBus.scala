package eventbus

import cats.effect.IO
import fs2.concurrent.Topic

trait EventBus[E] {
  def publish(event: E): IO[Unit]
  def subscribe(handler: E => IO[Unit]): fs2.Stream[IO, Unit]
}

object EventBus {

  private class TopicEventBus[E](topic: Topic[IO, E]) extends EventBus[E] {

    override def publish(event: E): IO[Unit] =
      topic.publish1(event) *> topic.subscribers
        .take(1)
        .compile
        .last
        .flatMap(x =>
          IO.println(s"Published event to ${x.getOrElse(0)} subscribers")
        )

    override def subscribe(handler: E => IO[Unit]): fs2.Stream[IO, Unit] =
      topic.subscribeUnbounded.evalMap(handler)
  }

  def create[E]: IO[EventBus[E]] =
    Topic[IO, E].map(topic => TopicEventBus[E](topic))
}
