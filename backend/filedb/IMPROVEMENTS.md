# FileDB Improvements

Planned improvements to the file-based DB implementation, ordered by priority. Error management is intentionally excluded — it will be addressed separately.

## 1. Migrate to `fs2.io.file.Files[F]` — DONE

Replaced all uses of `java.nio.file.Files` + `Sync[F].blocking` with `fs2.io.file.Files[F]`. This single change subsumed four planned improvements:

- **Resource leak in `list`** — `FsFiles[F].list` returns a `Stream[F, Path]` that closes the underlying `DirectoryStream` automatically. No more leaked file handles.
- **Streaming over the directory** — `list` / `filter` / `find` now stream entries through `evalMap(readEntity)`. `find` short-circuits via `Stream.find(f).compile.last` instead of materializing every entity into memory.
- **Cancellation** — fs2's `Files` operations are cancelable natively, replacing the `Sync[F].blocking` calls that were not.
- **Explicit UTF-8** — `readUtf8` / `writeUtf8` are charset-explicit by name.

`tables` and `dbs` (on `FileDB` / `FileDBEngine`) were previously synchronous `List[String]` returns that also leaked handles via `Files.list(...).iterator()`. They now return `F[List[String]]` and use the fs2 streaming API too.

Typeclass constraints: classes now require `Async[F]: FsFiles[F]`. The explicit `FsFiles` bound is required because fs2 deprecated the `Async`-based implicit summon of `Files[F]` in 3.7.

## 2. Concurrency safety (correctness bug) — DONE

The read-modify-write in `update(id, updateF)` is not atomic. Two fibers updating the same id concurrently can both read the same starting state and one write will overwrite the other — a lost update.

**Fix applied:** added a per-table `cats.effect.std.Mutex` and acquire it around `update`, `create`, and `delete` via `writeLock.lock.surround`. Reads (`get`, `list`, `filter`, `find`) stay lock-free.

Because `Mutex[F]` is built effectfully, `FileTable`'s primary constructor is now private and a `FileTable.apply` smart constructor returns `F[FileTable[F, E]]`. This propagated to `FileDB.table`, which now also returns `F[FileTable[...]]`.

A single per-table mutex is good enough for now; per-id locking (via `MapRef`) is an optimization to revisit if contention shows up.

## 3. Create-vs-overwrite semantics — DONE

`create` previously silently overwrote an existing entity, making it indistinguishable from `update`.

**Fix applied:** `writeEntity` now takes a `Flags` parameter. `create` passes `Flags(Flag.Write, Flag.CreateNew)` — the filesystem raises `FileAlreadyExistsException` if the file already exists. `update` passes `Flags.Write` (Write + Create + Truncate) which keeps its previous overwrite behavior.

Side effect: writing went from `FsFiles[F].writeUtf8` (which doesn't take flags) to `writeAll` with an explicit UTF-8 byte encoding via `String.getBytes(StandardCharsets.UTF_8)`.

## 4. Ensure the directories exist — DONE

Each layer now owns creation of its own directory inside its smart constructor:

- `FileDBEngine.apply` creates the engine root directory.
- `FileDB.apply` creates its own db directory.
- `FileTable.apply` creates its own table directory.

All use `FsFiles[F].createDirectories(...)` which is idempotent — re-opening an existing engine/db/table is fine. Each layer can trust its parent already exists when it runs.

Verified end-to-end from a fully empty filesystem: an `engine.db("mydb").flatMap(_.table[Foo]("foos")).flatMap(_.create(...))` chain creates `engine/mydb/foos/a.json` correctly.

---

## Out of scope (for this pass)

- **Error management** — wrapping `IOException`, decoding failures, missing files into a domain error ADT. Will be tackled separately.
- **Indexing / secondary lookups** — `filter`/`find` will still be O(n) over the table.
- **Caching** — no in-memory cache; every read hits disk.
