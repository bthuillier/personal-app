import type { Meta, StoryObj } from "@storybook/react-vite";
import { DataTable, type Column } from "./DataTable";
import { FilterBar, type FilterOption } from "./FilterBar";
import { sampleAlbums, type SampleAlbum } from "./sampleAlbums.fixtures";

const columns: Column<SampleAlbum>[] = [
  { header: "Album", accessor: "name", primary: true },
  { header: "Artist", accessor: "artist" },
  { header: "Format", accessor: "format" },
  { header: "Release Date", accessor: "releaseDate", muted: true },
];

const filters: FilterOption<SampleAlbum>[] = [
  { name: "format", label: "Format", options: ["CD", "Vinyl"] },
  { name: "year", label: "Year", extract: (row) => row.releaseDate.slice(0, 4) },
  { name: "genre", label: "Genre", extract: (row) => row.genre },
];

const meta = {
  title: "Data/FilterBar",
  component: FilterBar<SampleAlbum>,
  args: {
    data: sampleAlbums,
    searchFields: ["name", "artist"],
    searchPlaceholder: "Search by name or artist...",
    filters,
    children: (filtered: SampleAlbum[]) => (
      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(a) => a.id}
        emptyMessage="No albums found."
      />
    ),
  },
} satisfies Meta<typeof FilterBar<SampleAlbum>>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Search, filters and the table below; filters are kept in the URL query. */
export const WithDataTable: Story = {};

export const SearchOnly: Story = {
  args: { filters: [] },
};
