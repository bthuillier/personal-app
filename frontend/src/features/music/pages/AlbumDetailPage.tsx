import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { albumsQuery } from "@/features/music/api";
import { useReviewAlbum, useUpdateAlbumDetails } from "@/features/music/api";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/display/StarRating";
import { ReviewEditor, MarkdownView } from "@/features/music/components/ReviewEditor";
import { Panel } from "@/components/display/Panel";
import { BackLink, PageHeader } from "@/components/layout/PageHeader";
import { Page } from "@/components/layout/Page";
import { EmptyState } from "@/components/display/EmptyState";
import { QueryGate } from "@/components/data/QueryGate";
import { ItemForm, type FieldDefinition } from "@/components/form/ItemForm";
import { albumFormats, type AlbumDetails } from "@/features/music/types";

const BACK = { to: "/music/albums", label: "Back to Albums" };


const detailFields: FieldDefinition<AlbumDetails>[] = [
  { name: "format", label: "Format", type: "select", options: albumFormats },
  { name: "releaseDate", label: "Release Date", type: "date" },
];

export function AlbumDetailPage() {
  const { id } = useParams<{ id: string }>();
  const albumsResult = useQuery(albumsQuery);
  const { data: albums = [] } = albumsResult;
  const [editing, setEditing] = useState(false);
  const [editingDetails, setEditingDetails] = useState(false);
  const navigate = useNavigate();

  const album = useMemo(
    () => albums.find((a) => a.id === id),
    [albums, id],
  );

  const reviewMutation = useReviewAlbum(id ?? "");
  const detailsMutation = useUpdateAlbumDetails(id ?? "");

  if (!albumsResult.isSuccess) return <QueryGate queries={[albumsResult]} />;

  if (!album) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink {...BACK} />
        <EmptyState>Album not found.</EmptyState>
      </div>
    );
  }

  return (
    <Page>
      <div className="flex flex-col gap-3">
        <PageHeader
          back={BACK}
          title={album.name}
          subtitle={
            <>
              {album.artist} &middot; {album.format} &middot; {album.releaseDate}
            </>
          }
          actions={
            !editingDetails && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingDetails(true)}
              >
                Edit Details
              </Button>
            )
          }
        />
        {editingDetails && (
          <ItemForm
            collapsible={false}
            fields={detailFields}
            initialValues={{ format: album.format, releaseDate: album.releaseDate }}
            onCancel={() => setEditingDetails(false)}
            onSubmit={async (values) => {
              const updated = await detailsMutation.mutateAsync(values);
              setEditingDetails(false);
              // A format change gives the album a new id.
              if (updated.id !== album.id) {
                navigate(`/music/albums/${updated.id}`, { replace: true });
              }
            }}
          />
        )}
      </div>

      <Panel
        title="Review"
        actions={
          !editing && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              {album.review ? "Edit Review" : "Add Review"}
            </Button>
          )
        }
      >
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
          <EmptyState>No review yet.</EmptyState>
        )}
      </Panel>
    </Page>
  );
}
