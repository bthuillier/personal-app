import { useCallback, useEffect, useMemo, useState } from "react";
import type { PartialAlbum } from "@/types/album";
import { fetchAlbums } from "@/api/albums";
import { DataTable, type Column } from "@/components/DataTable";
import { FilterBar, type FilterOption } from "@/components/FilterBar";

const searchFields: (keyof PartialAlbum & string)[] = ["name", "artist"];

const columns: Column<PartialAlbum>[] = [
  { header: "Album", accessor: "name" },
  { header: "Artist", accessor: "artist" },
  { header: "Format", accessor: "format" },
  { header: "Release Date", accessor: "releaseDate" },
];

export function AlbumListPage() {
  const [albums, setAlbums] = useState<PartialAlbum[]>([]);
  const [displayed, setDisplayed] = useState<PartialAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAlbums()
      .then(setAlbums)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load albums"),
      )
      .finally(() => setLoading(false));
  }, []);

  const handleFiltered = useCallback((filtered: PartialAlbum[]) => {
    setDisplayed(filtered);
  }, []);

  const filters: FilterOption<PartialAlbum>[] = useMemo(
    () => [
      { name: "format", label: "Format", options: ["CD", "Vinyl"] },
      {
        name: "year",
        label: "Year",
        extract: (row: PartialAlbum) => row.releaseDate.slice(0, 4),
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Albums</h2>
      </div>
      {loading && (
        <p className="text-sm text-muted-foreground">Loading...</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!loading && !error && (
        <>
          <FilterBar
            data={albums}
            searchPlaceholder="Search by name or artist..."
            searchFields={searchFields}
            filters={filters}
            onFiltered={handleFiltered}
          />
          <DataTable
            columns={columns}
            data={displayed}
            rowKey={(a) => `${a.artist}-${a.name}`}
            emptyMessage="No albums found."
          />
        </>
      )}
    </div>
  );
}
