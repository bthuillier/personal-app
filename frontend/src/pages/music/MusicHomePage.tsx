import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { api } from "@/api/client";

export function MusicHomePage() {
  const { data: albums = [] } = useQuery({
    queryKey: ["albums"],
    queryFn: async () => {
      const { data } = await api.GET("/albums");
      return data!;
    },
  });

  const { data: wishlist = [] } = useQuery({
    queryKey: ["wishlist-albums"],
    queryFn: async () => {
      const { data } = await api.GET("/wishlist/albums");
      return data!;
    },
  });

  const wanted = wishlist.filter((w) => w.status === "Wanted");
  const ordered = wishlist.filter((w) => w.status === "Ordered");

  const formatCounts = albums.reduce(
    (acc, a) => {
      acc[a.format] = (acc[a.format] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">Music</h1>
        <p className="text-muted-foreground">Your music collection at a glance</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
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
      </div>

      {ordered.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">On the way</h2>
          <div className="flex flex-col gap-2">
            {ordered.map((album) => (
              <div
                key={`${album.artist}-${album.name}`}
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
                key={`${album.artist}-${album.name}`}
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
