import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { components } from "@/api/schema";
import { api } from "@/api/client";
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
  const [displayed, setDisplayed] = useState<PartialAlbum[]>([]);

  const { data: albums = [], isLoading } = useQuery({
    queryKey: ["albums"],
    queryFn: async () => {
      const { data } = await api.GET("/albums");
      return data!;
    },
  });

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
      {isLoading && (
        <p className="text-sm text-muted-foreground">Loading...</p>
      )}
      {!isLoading && (
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
