import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { components } from "@/api/schema";
import { albumsQuery } from "@/api/queries";
import { useCreateAlbum } from "@/api/mutations";
import { DataTable, type Column } from "@/components/DataTable";
import { FilterBar, type FilterOption } from "@/components/FilterBar";
import { ItemForm, type FieldDefinition } from "@/components/ItemForm";
import { GenreCell } from "@/components/GenreCell";

type PartialAlbum = components["schemas"]["PartialAlbum"];

const searchFields: (keyof PartialAlbum & string)[] = ["name", "artist"];

const formFields: FieldDefinition[] = [
  { name: "name", label: "Album", type: "text" },
  { name: "artist", label: "Artist", type: "text" },
  { name: "format", label: "Format", type: "select", options: ["Vinyl", "CD"] },
  { name: "releaseDate", label: "Release Date", type: "date" },
];

export function AlbumListPage() {
  const { data: albums = [], isLoading } = useQuery(albumsQuery);
  const createMutation = useCreateAlbum();

  const knownGenres = useMemo(() => {
    const set = new Set<string>();
    for (const a of albums) for (const g of a.genre ?? []) set.add(g);
    return [...set].sort();
  }, [albums]);

  const columns = useMemo<Column<PartialAlbum>[]>(
    () => [
      { header: "Album", accessor: "name" },
      { header: "Artist", accessor: "artist" },
      { header: "Format", accessor: "format" },
      { header: "Release Date", accessor: "releaseDate" },
      {
        header: "Genres",
        sortable: false,
        render: (row) => (
          <GenreCell
            albumId={row.id}
            genres={row.genre}
            knownGenres={knownGenres}
          />
        ),
      },
    ],
    [knownGenres],
  );

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
