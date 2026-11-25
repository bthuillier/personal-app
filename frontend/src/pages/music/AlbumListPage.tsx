import { useMemo } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import type { components } from "@/api/schema";
import { albumsQuery } from "@/api/queries";
import { useCreateAlbum } from "@/api/mutations";
import type { Column } from "@/components/data/DataTable";
import { CollectionPage } from "@/components/data/CollectionPage";
import type { FilterOption } from "@/components/data/FilterBar";
import { ItemForm, type FieldDefinition } from "@/components/form/ItemForm";
import { GenreCell } from "@/pages/music/GenreCell";

type PartialAlbum = components["schemas"]["PartialAlbum"];

const searchFields: (keyof PartialAlbum & string)[] = ["name", "artist"];

const formFields: FieldDefinition[] = [
  { name: "name", label: "Album", type: "text" },
  { name: "artist", label: "Artist", type: "text" },
  { name: "format", label: "Format", type: "select", options: ["Vinyl", "CD"] },
  { name: "releaseDate", label: "Release Date", type: "date" },
];

export function AlbumListPage() {
  const navigate = useNavigate();
  const query = useQuery(albumsQuery);
  const createMutation = useCreateAlbum();

  const knownGenres = useMemo(() => {
    const set = new Set<string>();
    for (const a of query.data ?? []) for (const g of a.genre ?? []) set.add(g);
    return [...set].sort();
  }, [query.data]);

  const columns = useMemo<Column<PartialAlbum>[]>(
    () => [
      { header: "Album", accessor: "name", primary: true },
      { header: "Artist", accessor: "artist", truncate: true },
      { header: "Format", accessor: "format" },
      { header: "Release Date", accessor: "releaseDate", muted: true },
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
      {
        name: "genre",
        label: "Genre",
        extract: (row: PartialAlbum) => row.genre ?? [],
      },
    ],
    [],
  );

  return (
    <CollectionPage
      title="Albums"
      actions={
        <ItemForm
          fields={formFields}
          onSubmit={handleCreate}
          buttonLabel="+ Add Album"
          submitLabel="Add Album"
        />
      }
      query={query}
      columns={columns}
      rowKey={(a) => a.id}
      onRowClick={(a) => navigate(`/music/albums/${a.id}`)}
      searchFields={searchFields}
      searchPlaceholder="Search by name or artist..."
      filters={filters}
      emptyMessage="No albums found."
    />
  );
}
