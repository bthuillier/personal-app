import { useQuery } from "@tanstack/react-query";
import type { components } from "@/api/schema";
import { wishlistQuery } from "@/api/queries";
import {
  useAddToWishlist,
  useOrderWishlistAlbum,
  useReceiveWishlistAlbum,
} from "@/api/mutations";
import type { Column } from "@/components/data/DataTable";
import { CollectionPage } from "@/components/data/CollectionPage";
import type { FilterOption } from "@/components/data/FilterBar";
import { StatusBadge } from "@/components/display/StatusBadge";
import { ItemForm, type FieldDefinition } from "@/components/form/ItemForm";
import { Button } from "@/components/ui/button";

type WishlistAlbum = components["schemas"]["WishlistAlbum"];
type WishlistStatus = components["schemas"]["WishlistStatus"];

const statusColorMap: Record<WishlistStatus, "default" | "secondary" | "outline"> = {
  Wanted: "outline",
  Ordered: "secondary",
  Received: "default",
};

const searchFields: (keyof WishlistAlbum & string)[] = ["name", "artist"];

const filters: FilterOption<WishlistAlbum>[] = [
  { name: "status", label: "Status", options: ["Wanted", "Ordered", "Received"] },
  { name: "format", label: "Format", options: ["CD", "Vinyl"] },
];

const formFields: FieldDefinition[] = [
  { name: "name", label: "Album", type: "text" },
  { name: "artist", label: "Artist", type: "text" },
  { name: "format", label: "Format", type: "select", options: ["Vinyl", "CD"] },
  { name: "releaseDate", label: "Release Date", type: "date" },
  { name: "status", label: "Status", type: "select", options: ["Wanted", "Ordered"] },
];

export function WishlistPage() {
  const { data: albums = [], isLoading } = useQuery(wishlistQuery);

  const addMutation = useAddToWishlist();
  const orderMutation = useOrderWishlistAlbum();
  const receivedMutation = useReceiveWishlistAlbum();

  async function handleAdd(values: Record<string, string>) {
    await addMutation.mutateAsync(
      values as unknown as components["schemas"]["AddAlbumToWishlist"],
    );
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
      data={albums}
      isLoading={isLoading}
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
