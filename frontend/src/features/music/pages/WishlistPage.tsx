import { useQuery } from "@tanstack/react-query";
import { wishlistQuery } from "@/features/music/api";
import { useAddToWishlist, useOrderWishlistAlbum, useReceiveWishlistAlbum } from "@/features/music/api";
import type { Column } from "@/components/data/DataTable";
import { CollectionPage } from "@/components/data/CollectionPage";
import type { FilterOption } from "@/components/data/FilterBar";
import { StatusBadge } from "@/components/display/StatusBadge";
import { ItemForm, type FieldDefinition } from "@/components/form/ItemForm";
import { Button } from "@/components/ui/button";
import { albumFormats, wishlistStatuses, type AddAlbumToWishlist, type WishlistAlbum, type WishlistStatus } from "@/features/music/types";


const statusColorMap: Record<WishlistStatus, "default" | "secondary" | "outline"> = {
  Wanted: "outline",
  Ordered: "secondary",
  Received: "default",
};

const searchFields: (keyof WishlistAlbum & string)[] = ["name", "artist"];

const filters: FilterOption<WishlistAlbum>[] = [
  { name: "status", label: "Status", options: wishlistStatuses },
  { name: "format", label: "Format", options: albumFormats },
];

const formFields: FieldDefinition<AddAlbumToWishlist>[] = [
  { name: "name", label: "Album", type: "text" },
  { name: "artist", label: "Artist", type: "text" },
  {
    name: "format",
    label: "Format",
    type: "select",
    options: albumFormats,
    defaultValue: "Vinyl",
  },
  { name: "releaseDate", label: "Release Date", type: "date" },
  {
    name: "status",
    label: "Status",
    type: "select",
    // A new entry can't already be received.
    options: wishlistStatuses.filter((s) => s !== "Received"),
  },
];

export function WishlistPage() {
  const query = useQuery(wishlistQuery);

  const addMutation = useAddToWishlist();
  const orderMutation = useOrderWishlistAlbum();
  const receivedMutation = useReceiveWishlistAlbum();

  async function handleAdd(values: AddAlbumToWishlist) {
    await addMutation.mutateAsync(values);
  }

  const columns: Column<WishlistAlbum>[] = [
    { header: "Album", accessor: "name", primary: true },
    { header: "Artist", accessor: "artist", truncate: true },
    { header: "Format", accessor: "format" },
    { header: "Release Date", accessor: "releaseDate", muted: true },
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
              disabled={orderMutation.isPending && orderMutation.variables === row.id}
              onClick={() => orderMutation.mutate(row.id)}
            >
              Mark Ordered
            </Button>
          )}
          {row.status === "Ordered" && (
            <Button
              size="sm"
              disabled={
                receivedMutation.isPending && receivedMutation.variables === row.id
              }
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
    <CollectionPage
      title="Wishlist"
      actions={
        <ItemForm
          fields={formFields}
          onSubmit={handleAdd}
          buttonLabel="+ Add Album"
          submitLabel="Add to Wishlist"
        />
      }
      query={query}
      columns={columns}
      rowKey={(a) => a.id}
      searchFields={searchFields}
      searchPlaceholder="Search by name or artist..."
      filters={filters}
      emptyMessage="No albums found."
      emptyCollectionMessage="No albums in your wishlist yet."
    />
  );
}
