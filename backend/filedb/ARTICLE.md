# Building a Tiny File-Based DB in Scala with cats-effect and fs2

Sometimes you don't need Postgres. You don't need SQLite. You don't even need a real database. You just need a place to dump some JSON files in a folder, read them back later, and call it a day. This is the story of building exactly that — a generic, typed, file-based "database" in Scala 3 — and how the implementation evolved from a naive sketch to something that's actually safe to use.

## The starting point

The shape of the API is the easy part. A `FileDBEngine` contains many `FileDB`s; each `FileDB` contains many `FileTable[E]`s; each table stores entities of one type `E` as `<id>.json` files on disk.

The first cut looked like this:

```scala
class FileTable[F[_], E: Encoder: Decoder](rootPath: Path, name: String) {
  def list: F[List[E]] = ???
  def get(id: String): F[E] = ???
  def filter(f: E => Boolean): F[List[E]] = ???
  def find(f: E => Boolean): F[Option[E]] = ???
  def delete(id: String): F[Unit] = ???
  def update(id: String, updateF: E => E): F[Unit] = ???
  def update(id: String, entity: E): F[Unit] = update(id, _ => entity)
  def create(id: String, entity: E): F[Unit] = ???
}
```

`F[_]` is left abstract — the user picks `IO`, or whatever. Encoding and decoding lean on circe via the `Encoder`/`Decoder` context bounds. Each method returns its result in `F` because, well, we're going to touch the disk and that's an effect.

The first implementation reached for `java.nio.file.Files` and wrapped each call in `Sync[F].blocking`:

```scala
private def readEntity(p: Path): F[E] =
  Sync[F].blocking(Files.readString(p)).flatMap { s =>
    Sync[F].fromEither(decode[E](s))
  }
```

Works. Ships. Done?

Not quite. Once you start poking at it, problems surface.

## Problem 1: concurrent updates lose data

The natural definition of `update` is read-modify-write:

```scala
def update(id: String, updateF: E => E): F[Unit] =
  get(id).flatMap(e => writeEntity(filePath(id), updateF(e)))
```

If two fibers call `update("user-42", ...)` at the same time, both can read the same starting state, both compute their new version, and the later write silently clobbers the earlier one. A lost update — the classic concurrency bug.

The fix is a `Mutex` from `cats.effect.std`. Wrap every write in `writeLock.lock.surround { ... }`, and only one writer can touch the table at a time. Reads stay lock-free.

But `Mutex[F]` is constructed *effectfully* — you get it inside `F`, not as a plain value. That means `FileTable` can no longer have a synchronous constructor:

```scala
class FileTable[F[_]: Async, E: Encoder: Decoder] private (
    rootPath: Path,
    name: String,
    writeLock: Mutex[F]
)

object FileTable {
  def apply[F[_]: Async, E: Encoder: Decoder](rootPath: Path, name: String): F[FileTable[F, E]] =
    Mutex[F].map(new FileTable[F, E](rootPath, name, _))
}
```

The primary constructor goes private, a smart constructor takes its place, and the result is wrapped in `F`. Anyone constructing a table now lives in `F` too — but that's fine, the only sensible place to do it was inside an effect anyway.

A small note on granularity: this is a *per-table* mutex, not per-id. Two `delete` calls against different ids will serialize even though they could safely run in parallel. For a personal app with low contention that's a non-issue. The fix — a `MapRef[F, String, Mutex[F]]` that lazily creates one mutex per id — works but leaks one map entry per id ever touched. Trade-off accepted; we'll revisit if it ever matters.

## Problem 2: `java.nio.file.Files` is the wrong API

The original implementation had a subtle resource leak. This line:

```scala
Files.list(fullPath).iterator().asScala.toList
```

…opens a `DirectoryStream` (one OS file handle) and never closes it. Every call to `list` leaks a handle. On a long-running process listing tables in a hot loop, this is a slow-motion file-descriptor exhaustion.

The fix is technically simple — wrap in `bracket` — but at this point a better question presents itself: *why are we using the blocking `java.nio.file.Files` API at all when we're already in cats-effect land?*

fs2 ships `fs2.io.file.Files[F]`, a cats-effect-native file API. It's an algebra parameterized on `F`, with methods like:

```scala
FsFiles[F].readUtf8(path).compile.string
FsFiles[F].list(path)        // returns Stream[F, Path], auto-closed
FsFiles[F].delete(path)
FsFiles[F].createDirectories(path)
FsFiles[F].writeAll(path, flags)
```

Switching to it eliminated four planned improvements in one go:

- The directory-stream leak in `list` — gone, fs2's `list` is a resource-managed `Stream`.
- The "load everything into memory" pattern of `list` / `filter` / `find` — replaced with a streaming pipeline that short-circuits on `find`.
- The non-cancelable `Sync[F].blocking` calls — fs2's operations are interruptible natively.
- The implicit UTF-8 assumption — `readUtf8` / `writeUtf8` are charset-explicit by name.

The new `list` is one line of plumbing:

```scala
FsFiles[F]
  .list(fullFsPath)
  .evalFilter(FsFiles[F].isRegularFile(_))
  .filter(_.extName == ".json")
  .evalMap(readEntity)
```

And `find` short-circuits properly:

```scala
def find(f: E => Boolean): F[Option[E]] = entities.find(f).compile.last
```

`entities.find(f)` is a `Stream[F, E]` that pulls one entity at a time, runs the predicate, and stops at the first match. The old implementation read every entity into a list and *then* filtered — now we stop as soon as we have an answer.

One gotcha: in fs2 3.7+, summoning `Files[F]` implicitly via `Async[F]` is deprecated. You're expected to bring `Files` into scope as its own constraint. So the class signatures grew an extra context bound:

```scala
class FileTable[F[_]: Async: FsFiles, E: Encoder: Decoder] private (...)
```

A small papercut, but the right direction — it makes the dependency explicit instead of magicked-up from `Async`.

## Problem 3: `create` was a lie

The first version of `create` did this:

```scala
def create(id: String, entity: E): F[Unit] = writeEntity(filePath(id), entity)
```

`writeEntity` used `writeUtf8`, which truncates and replaces. So `create("a", foo)` followed by `create("a", bar)` silently overwrote — `create` was indistinguishable from `update`. That's a bug magnet: a duplicate-id bug in calling code goes unnoticed forever.

fs2's `writeAll` takes a `Flags` argument that maps to NIO's open options:

```scala
def writeEntity(p: FsPath, entity: E, flags: Flags): F[Unit] =
  fs2.Stream
    .chunk(fs2.Chunk.array(entity.asJson.spaces2.getBytes(StandardCharsets.UTF_8)))
    .through(FsFiles[F].writeAll(p, flags))
    .compile
    .drain

def create(id: String, entity: E): F[Unit] =
  withLock(writeEntity(filePath(id), entity, Flags(Flag.Write, Flag.CreateNew)))

def update(id: String, updateF: E => E): F[Unit] =
  withLock(get(id).flatMap(e => writeEntity(filePath(id), updateF(e), Flags.Write)))
```

`Flags(Flag.Write, Flag.CreateNew)` tells the filesystem: open for writing, but fail if the file already exists. A second `create` with the same id now raises `FileAlreadyExistsException` from the OS itself — surfacing the conflict instead of swallowing it. `Flags.Write` (Write + Create + Truncate) preserves the original "overwrite or create" semantics for `update`.

We lost the convenience of `writeUtf8` (which doesn't take flags) and had to encode the JSON string to bytes manually. Worth it.

## Problem 4: who owns directory creation?

Nothing in the first implementation ever called `createDirectories`. Open an engine pointing at an empty directory, ask for a fresh table, call `create("a", foo)` — boom, `NoSuchFileException`. The on-disk hierarchy doesn't exist yet.

The interesting question isn't *whether* to create the directories — it's *which layer owns each level of the hierarchy*. Three candidates:

- A bootstrap step somewhere that pre-creates everything (push the problem onto the user).
- Each layer eagerly creates the layer below it (parent creates children — feels wrong, you might want to construct an engine without committing to any specific dbs yet).
- Each layer creates *its own* directory (children take care of themselves).

The third option is the cleanest. Each smart constructor is responsible for the directory it represents:

```scala
object FileDBEngine {
  def apply[F[_]: Async: FsFiles](rootPath: Path, dbRelativePath: Path): F[FileDBEngine[F]] =
    val enginePath = FsPath.fromNioPath(rootPath.resolve(dbRelativePath))
    FsFiles[F].createDirectories(enginePath).as(new FileDBEngine[F](enginePath))
}

object FileDB {
  def apply[F[_]: Async: FsFiles](parentPath: FsPath, name: String): F[FileDB[F]] =
    val dbPath = parentPath / name
    FsFiles[F].createDirectories(dbPath).as(new FileDB[F](name, dbPath))
}

object FileTable {
  def apply[F[_]: Async: FsFiles, E: Encoder: Decoder](parentPath: FsPath, name: String): F[FileTable[F, E]] =
    val tablePath = parentPath / name
    FsFiles[F].createDirectories(tablePath) *>
      Mutex[F].map(new FileTable[F, E](name, tablePath, _))
}
```

`createDirectories` is idempotent, so re-opening an existing engine/db/table is fine — no error, no harm. The end result is that you can call `FileDBEngine[IO](root, rel)` on a totally empty filesystem and any subsequent `db(...)` / `table(...)` call works without preamble.

This change pulled `FileDBEngine.db` and `FileDB` itself into `F` — `db(name): F[FileDB[F]]` instead of the previous synchronous `db(name): FileDB[F]`. Once one layer goes effectful, the rest follow.

## A note on factoring

Halfway through this work the body of `FileTable` started looking repetitive. Three methods all repeated the same four-line prefix:

```scala
FsFiles[F]
  .list(fullFsPath)
  .evalFilter(FsFiles[F].isRegularFile(_))
  .filter(_.extName == ".json")
  .evalMap(readEntity)
```

And three methods all wrapped their body in `writeLock.lock.surround(...)`. Both came out as named helpers:

```scala
private def entities: fs2.Stream[F, E] =
  FsFiles[F]
    .list(fullFsPath)
    .evalFilter(FsFiles[F].isRegularFile(_))
    .filter(_.extName == ".json")
    .evalMap(readEntity)

private def withLock[A](fa: F[A]): F[A] = writeLock.lock.surround(fa)

def list: F[List[E]] = entities.compile.toList
def filter(f: E => Boolean): F[List[E]] = entities.filter(f).compile.toList
def find(f: E => Boolean): F[Option[E]] = entities.find(f).compile.last
def delete(id: String): F[Unit] = withLock(FsFiles[F].delete(filePath(id)))
def create(id: String, entity: E): F[Unit] = withLock(writeEntity(...))
```

`FileDB.tables` and `FileDBEngine.dbs` shared an identical "list subdirectories" implementation. That came out as a top-level package-private helper.

None of this was profound. But the API became noticeably easier to read once each public method was one line of intent on top of named building blocks, rather than several lines of plumbing inlined into the body.

## What didn't make the cut

A few improvements were considered and dropped — worth saying why, because the discipline of *not* building something is at least as important as building it.

**Atomic writes.** Standard advice for crash safety is to write to `<id>.json.tmp` and atomically `move()` it into place. That way a JVM crash mid-write never leaves a partial file behind. For a server with real uptime requirements this is non-negotiable. For a personal app where the worst case is "I ctrl-C the dev server and one pedal's JSON is empty, I'll re-add it from the UI", the extra complexity isn't worth it. Skip.

**Per-id locking.** As mentioned earlier — real per-id concurrency means an unbounded growing map of mutexes. The bounded contention of a per-table mutex is fine until it isn't.

**Error management.** Decoding errors, missing files, IO failures — these currently bubble up as raw `IOException` or circe `DecodingFailure` values in `F`. A real API would wrap them in a domain error ADT. Deferred deliberately to keep the scope tight; the type signatures don't change when we add it.

**Indexing.** `filter` and `find` are O(n) over the table. Fine for hundreds of entities, terrible for millions. If we ever needed it, we'd build a secondary index alongside the JSON files. We never will.

## Where it ended up

The final shape is about 80 lines of Scala, well-typed, properly cancelable, leak-free, and crash-tolerant within reason. It supports parameterized `F[_]` (so `IO` users and `Resource`-using callers and pure-`Sync` test suites all work the same way), and parameterized `E` (so every domain type that has circe codecs gets a free typed table). The hierarchy creates its own directories, refuses to silently overwrite on `create`, and serializes writes within a table.

Crucially, none of these properties were free. Each one came from picking at the previous version's behavior, asking "what happens if…", and either fixing it or consciously deciding the fix wasn't worth the cost. The mutex took a smart constructor. The fs2 migration took a deprecation chase. The `CreateNew` flag took a small detour through bytes-and-charsets. The directory ownership took rethinking which layer is responsible for what.

The shape of the code in version one wasn't *wrong*. It was just first-pass: optimistic about concurrency, optimistic about resource handling, optimistic about disk state. Each round of improvement was a small piece of that optimism replaced with something the runtime can actually rely on.

That's most of what software engineering is, when you strip it back. Not building the thing — *that* part is usually easy. It's noticing what you optimistically assumed, and one by one, deciding whether to fix it or own it.
