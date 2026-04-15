import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { components } from "@/api/schema";
import { api } from "@/api/client";
import { wishlistQuery } from "@/api/queries";
import { DataTable, type Column } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { ItemForm, type FieldDefinition } from "@/components/ItemForm";
import { Button } from "@/components/ui/button";

type WishlistAlbum = components["schemas"]["WishlistAlbum"];
type WishlistStatus = components["schemas"]["WishlistStatus"];

const statusColorMap: Record<WishlistStatus, "default" | "secondary" | "outline"> = {
  Wanted: "outline",
  Ordered: "secondary",
  Received: "default",
};

const formFields: FieldDefinition[] = [
  { name: "name", label: "Album", type: "text" },
  { name: "artist", label: "Artist", type: "text" },
  { name: "format", label: "Format", type: "select", options: ["Vinyl", "CD"] },
  { name: "releaseDate", label: "Release Date", type: "date" },
  { name: "status", label: "Status", type: "select", options: ["Wanted", "Ordered"] },
];

export function WishlistPage() {
  const queryClient = useQueryClient();

  const { data: albums = [], isLoading } = useQuery(wishlistQuery);

  const addMutation = useMutation({
    mutationFn: async (body: components["schemas"]["AddAlbumToWishlist"]) => {
      await api.POST("/wishlist/albums", { body });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wishlist-albums"] }),
  });

  const orderMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.POST("/wishlist/albums/{id}/order", {
        params: { path: { id } },
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wishlist-albums"] }),
  });

  const receivedMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.POST("/wishlist/albums/{id}/received", {
        params: { path: { id } },
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wishlist-albums"] }),
  });

  async function handleAdd(values: Record<string, string>) {
    await addMutation.mutateAsync(
      values as unknown as components["schemas"]["AddAlbumToWishlist"],
    );
  }

  const columns: Column<WishlistAlbum>[] = [
    { header: "Album", accessor: "name" },
    { header: "Artist", accessor: "artist" },
    { header: "Format", accessor: "format" },
    { header: "Release Date", accessor: "releaseDate" },
    {
      header: "Status",
      render: (row) => (
        <StatusBadge status={row.status} colorMap={statusColorMap} />
      ),
    },
    {
      header: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          {row.status === "Wanted" && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => orderMutation.mutate(row.id)}
            >
              Mark Ordered
            </Button>
          )}
          {row.status === "Ordered" && (
            <Button
              size="sm"
              onClick={() => receivedMutation.mutate(row.id)}
            >
              Mark Received
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Album Wishlist</h2>
        <ItemForm
          fields={formFields}
          onSubmit={handleAdd}
          buttonLabel="+ Add Album"
          submitLabel="Add to Wishlist"
        />
      </div>
      {isLoading && (
        <p className="text-sm text-muted-foreground">Loading...</p>
      )}
      {!isLoading && (
        <DataTable
          columns={columns}
          data={albums}
          rowKey={(a) => a.id}
          emptyMessage="No albums in your wishlist yet."
        />
      )}
    </div>
  );
}
