import { useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { albumsQuery } from "@/api/queries";
import { useReviewAlbum, useUpdateAlbumDetails } from "@/api/mutations";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/StarRating";
import { ReviewEditor, MarkdownView } from "@/components/ReviewEditor";
import { AlbumDetailsEditor } from "./AlbumDetailsEditor";

export function AlbumDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: albums = [], isLoading } = useQuery(albumsQuery);
  const [editing, setEditing] = useState(false);
  const [editingDetails, setEditingDetails] = useState(false);
  const navigate = useNavigate();

  const album = useMemo(
    () => albums.find((a) => a.id === id),
    [albums, id],
  );

  const reviewMutation = useReviewAlbum(id ?? "");
  const detailsMutation = useUpdateAlbumDetails(id ?? "");

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
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">
            {album.artist} &middot; {album.format} &middot; {album.releaseDate}
          </p>
          {!editingDetails && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingDetails(true)}
            >
              Edit
            </Button>
          )}
        </div>
        {editingDetails && (
          <div className="mt-2">
            <AlbumDetailsEditor
              initial={{ format: album.format, releaseDate: album.releaseDate }}
              onCancel={() => setEditingDetails(false)}
              onSave={async (details) => {
                const updated = await detailsMutation.mutateAsync(details);
                setEditingDetails(false);
                // A format change gives the album a new id.
                if (updated.id !== album.id) {
                  navigate(`/music/albums/${updated.id}`, { replace: true });
                }
              }}
            />
          </div>
        )}
      </div>

      <section className="rounded-lg border border-border p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Review
          </h3>
          {!editing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
            >
              {album.review ? "Edit Review" : "Add Review"}
            </Button>
          )}
        </div>

        {editing ? (
          <ReviewEditor
            initial={album.review}
            onCancel={() => setEditing(false)}
            onSave={async (review) => {
              await reviewMutation.mutateAsync(review);
              setEditing(false);
            }}
          />
        ) : album.review ? (
          <div className="flex flex-col gap-3">
            {album.review.title && (
              <h4 className="text-lg font-semibold">{album.review.title}</h4>
            )}
            <StarRating value={album.review.rating} readOnly size={24} />
            <MarkdownView source={album.review.description} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No review yet.</p>
        )}
      </section>
    </div>
  );
}
