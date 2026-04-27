import { useMemo } from "react";
import { useParams, Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { albumsQuery } from "@/api/queries";

export function AlbumDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: albums = [], isLoading } = useQuery(albumsQuery);

  const album = useMemo(
    () => albums.find((a) => a.id === id),
    [albums, id],
  );

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  if (!album) {
    return (
      <div className="flex flex-col gap-4">
        <Link
          to="/music/albums"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Albums
        </Link>
        <p className="text-sm text-muted-foreground">Album not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <Link
          to="/music/albums"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Albums
        </Link>
        <h2 className="text-xl font-semibold">{album.name}</h2>
        <p className="text-sm text-muted-foreground">
          {album.artist} &middot; {album.format} &middot; {album.releaseDate}
        </p>
      </div>

      <section className="rounded-lg border border-border p-5">
        <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Review
        </h3>
        {album.review ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold">
                {album.review.rating}
              </span>
              <span className="text-sm text-muted-foreground">/ 10</span>
            </div>
            <p className="whitespace-pre-wrap text-sm">
              {album.review.description}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No review yet.</p>
        )}
      </section>
    </div>
  );
}
