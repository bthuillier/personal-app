import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { components } from "@/api/schema";
import { albumsQuery } from "@/api/queries";
import { DataTable, type Column } from "@/components/DataTable";
import { FilterBar, type FilterOption } from "@/components/FilterBar";

type PartialAlbum = components["schemas"]["PartialAlbum"];

const searchFields: (keyof PartialAlbum & string)[] = ["name", "artist"];

const columns: Column<PartialAlbum>[] = [
  { header: "Album", accessor: "name" },
  { header: "Artist", accessor: "artist" },
  { header: "Format", accessor: "format" },
  { header: "Release Date", accessor: "releaseDate" },
];

export function AlbumListPage() {
  const { data: albums = [], isLoading } = useQuery(albumsQuery);

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
      {isLoading && (
        <p className="text-sm text-muted-foreground">Loading...</p>
      )}
      {!isLoading && (
        <FilterBar
          data={albums}
          searchPlaceholder="Search by name or artist..."
          searchFields={searchFields}
          filters={filters}
        >
          {(filtered) => (
            <DataTable
              columns={columns}
              data={filtered}
              rowKey={(a) => a.id}
              emptyMessage="No albums found."
            />
          )}
        </FilterBar>
      )}
    </div>
  );
}
