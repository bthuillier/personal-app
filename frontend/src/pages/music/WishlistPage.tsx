import { useEffect, useState, useCallback } from "react";
import type { WishlistAlbum, AddAlbumToWishlist, WishlistStatus } from "@/types/wishlist";
import {
  fetchWishlistAlbums,
  addAlbumToWishlist,
  orderAlbum,
  markAlbumReceived,
} from "@/api/wishlist";
import { DataTable, type Column } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { ItemForm, type FieldDefinition } from "@/components/ItemForm";
import { Button } from "@/components/ui/button";

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
];

export function WishlistPage() {
  const [albums, setAlbums] = useState<WishlistAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchWishlistAlbums();
      setAlbums(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load albums");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd(values: Record<string, string>) {
    await addAlbumToWishlist(values as unknown as AddAlbumToWishlist);
    load();
  }

  async function handleOrder(name: string, artist: string) {
    await orderAlbum(name, artist);
    load();
  }

  async function handleReceived(name: string, artist: string) {
    await markAlbumReceived(name, artist);
    load();
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
              onClick={() => handleOrder(row.name, row.artist)}
            >
              Mark Ordered
            </Button>
          )}
          {row.status === "Ordered" && (
            <Button
              size="sm"
              onClick={() => handleReceived(row.name, row.artist)}
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
      {loading && (
        <p className="text-sm text-muted-foreground">Loading...</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!loading && !error && (
        <DataTable
          columns={columns}
          data={albums}
          rowKey={(a) => `${a.artist}-${a.name}`}
          emptyMessage="No albums in your wishlist yet."
        />
      )}
    </div>
  );
}
