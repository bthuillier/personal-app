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

## 3. Create-vs-overwrite semantics

`create` currently silently overwrites an existing entity, making it indistinguishable from `update`. This hides bugs (duplicate IDs going unnoticed).

**Fix:** use `FsFiles[F].writeAll` with `Flags(Flag.Write, Flag.CreateNew)` so the filesystem rejects the write if the file already exists.

## 4. Ensure the table directory exists

Nothing in `FileTable` creates `fullPath`. The first call to `create` on a fresh table throws `NoSuchFileException`.

**Fix:** call `FsFiles[F].createDirectories(fullFsPath)` lazily on the first write (or eagerly inside `FileTable.apply` — the latter avoids a per-write check at the cost of a syscall at table construction).

---

## Out of scope (for this pass)

- **Error management** — wrapping `IOException`, decoding failures, missing files into a domain error ADT. Will be tackled separately.
- **Indexing / secondary lookups** — `filter`/`find` will still be O(n) over the table.
- **Caching** — no in-memory cache; every read hits disk.
