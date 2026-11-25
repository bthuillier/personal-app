import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "./DataTable";
import { sampleAlbums, type SampleAlbum } from "./sampleAlbums.fixtures";

const columns: Column<SampleAlbum>[] = [
  { header: "Album", accessor: "name", primary: true },
  { header: "Artist", accessor: "artist", truncate: true },
  { header: "Format", accessor: "format" },
  { header: "Release Date", accessor: "releaseDate", muted: true },
  {
    header: "Genres",
    sortable: false,
    render: (row) => (
      <div className="flex flex-wrap gap-1">
        {row.genre.map((g) => (
          <Badge key={g} variant="secondary">
            {g}
          </Badge>
        ))}
      </div>
    ),
  },
];

const meta = {
  title: "Data/DataTable",
  component: DataTable<SampleAlbum>,
  args: {
    columns,
    data: sampleAlbums.slice(0, 8),
    rowKey: (a: SampleAlbum) => a.id,
    emptyMessage: "No albums found.",
  },
} satisfies Meta<typeof DataTable<SampleAlbum>>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Click a header to sort; the primary column wraps long titles. */
export const Default: Story = {};

export const Empty: Story = {
  args: { data: [] },
};

export const Paginated: Story = {
  args: { data: sampleAlbums, pageSize: 10 },
};

export const ClickableRows: Story = {
  args: { onRowClick: fn() },
};
