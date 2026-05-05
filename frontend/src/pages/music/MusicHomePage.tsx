import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { albumsQuery, wishlistQuery } from "@/api/queries";

const TOP_GENRES_LIMIT = 5;

export function MusicHomePage() {
  const { data: albums = [] } = useQuery(albumsQuery);
  const { data: wishlist = [] } = useQuery(wishlistQuery);

  const wanted = wishlist.filter((w) => w.status === "Wanted");
  const ordered = wishlist.filter((w) => w.status === "Ordered");

  const formatCounts = albums.reduce(
    (acc, a) => {
      acc[a.format] = (acc[a.format] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const genreCounts = new Map<string, number>();
  for (const album of albums) {
    for (const g of album.genre ?? []) {
      genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1);
    }
  }
  const topGenres = [...genreCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, TOP_GENRES_LIMIT)
    .map(([name, count]) => ({ name, count }));

  const maxGenreCount = topGenres[0]?.count ?? 0;
  const albumsWithoutGenre = albums.filter(
    (a) => !a.genre || a.genre.length === 0,
  ).length;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">Music</h1>
        <p className="text-muted-foreground">Your music collection at a glance</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link
          to="/music/albums"
          className="rounded-lg border border-border p-5 transition-colors hover:bg-muted/50"
        >
          <p className="text-sm text-muted-foreground">Albums</p>
          <p className="mt-1 text-3xl font-bold">{albums.length}</p>
          {Object.keys(formatCounts).length > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">
              {Object.entries(formatCounts)
                .map(([format, count]) => `${count} ${format}`)
                .join(" · ")}
            </p>
          )}
        </Link>
        <Link
          to="/music/wishlist"
          className="rounded-lg border border-border p-5 transition-colors hover:bg-muted/50"
        >
          <p className="text-sm text-muted-foreground">Wishlist</p>
          <p className="mt-1 text-3xl font-bold">{wishlist.length}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {wanted.length} wanted · {ordered.length} ordered
          </p>
        </Link>
        <div className="rounded-lg border border-border p-5">
          <p className="text-sm text-muted-foreground">Uncategorized</p>
          <p className="mt-1 text-3xl font-bold">{albumsWithoutGenre}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {albumsWithoutGenre === 1 ? "album needs" : "albums need"} a genre
          </p>
        </div>
        <div className="rounded-lg border border-border p-5">
          <h2 className="text-lg font-semibold">Top Genres</h2>
          {topGenres.length === 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">
              No genres assigned yet.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {topGenres.map((g) => (
                <li key={g.name}>
                  <Link
                    to={`/music/albums?genre=${encodeURIComponent(g.name)}`}
                    className="group flex flex-col gap-1"
                  >
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="text-foreground transition-colors group-hover:text-primary">
                        {g.name}
                      </span>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {g.count}
                      </span>
                    </div>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-foreground/70 transition-colors group-hover:bg-primary"
                        style={{
                          width: `${(g.count / maxGenreCount) * 100}%`,
                        }}
                      />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {ordered.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">On the way</h2>
          <div className="flex flex-col gap-2">
            {ordered.map((album) => (
              <div
                key={album.id}
                className="rounded-md border border-border px-4 py-3 text-sm"
              >
                <span className="font-medium">{album.name}</span>{" "}
                <span className="text-muted-foreground">by {album.artist}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {wanted.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Wanted</h2>
          <div className="flex flex-col gap-2">
            {wanted.map((album) => (
              <div
                key={album.id}
                className="rounded-md border border-border px-4 py-3 text-sm"
              >
                <span className="font-medium">{album.name}</span>{" "}
                <span className="text-muted-foreground">by {album.artist}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
