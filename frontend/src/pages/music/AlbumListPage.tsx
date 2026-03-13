import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { components } from "@/api/schema";
import { api } from "@/api/client";
import { albumsQuery } from "@/api/queries";
import { DataTable, type Column } from "@/components/DataTable";
import { FilterBar, type FilterOption } from "@/components/FilterBar";
import { ItemForm, type FieldDefinition } from "@/components/ItemForm";

type PartialAlbum = components["schemas"]["PartialAlbum"];

const searchFields: (keyof PartialAlbum & string)[] = ["name", "artist"];

const formFields: FieldDefinition[] = [
  { name: "name", label: "Album", type: "text" },
  { name: "artist", label: "Artist", type: "text" },
  { name: "format", label: "Format", type: "select", options: ["Vinyl", "CD"] },
  { name: "releaseDate", label: "Release Date", type: "date" },
];

const columns: Column<PartialAlbum>[] = [
  { header: "Album", accessor: "name" },
  { header: "Artist", accessor: "artist" },
  { header: "Format", accessor: "format" },
  { header: "Release Date", accessor: "releaseDate" },
];

export function AlbumListPage() {
  const queryClient = useQueryClient();
  const { data: albums = [], isLoading } = useQuery(albumsQuery);

  const createMutation = useMutation({
    mutationFn: async (body: components["schemas"]["CreateAlbum"]) => {
      await api.POST("/albums", { body });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["albums"] }),
  });

  async function handleCreate(values: Record<string, string>) {
    await createMutation.mutateAsync(
      values as unknown as components["schemas"]["CreateAlbum"],
    );
  }

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
        <ItemForm
          fields={formFields}
          onSubmit={handleCreate}
          buttonLabel="+ Add Album"
          submitLabel="Add Album"
        />
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
