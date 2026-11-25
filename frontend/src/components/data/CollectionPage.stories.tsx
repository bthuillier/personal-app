import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { Button } from "@/components/ui/button";
import { CollectionPage } from "./CollectionPage";
import type { Column } from "./DataTable";
import type { FilterOption } from "./FilterBar";
import { sampleAlbums, type SampleAlbum } from "./sampleAlbums.fixtures";

const columns: Column<SampleAlbum>[] = [
  { header: "Album", accessor: "name", primary: true },
  { header: "Artist", accessor: "artist", truncate: true },
  { header: "Format", accessor: "format" },
  { header: "Release Date", accessor: "releaseDate", muted: true },
];

const filters: FilterOption<SampleAlbum>[] = [
  { name: "format", label: "Format", options: ["CD", "Vinyl"] },
  { name: "genre", label: "Genre", extract: (row) => row.genre },
];

const meta = {
  title: "Data/CollectionPage",
  component: CollectionPage<SampleAlbum>,
  args: {
    title: "Albums",
    actions: <Button>+ Add Album</Button>,
    data: sampleAlbums,
    isLoading: false,
    columns,
    rowKey: (a: SampleAlbum) => a.id,
    onRowClick: fn(),
    searchFields: ["name", "artist"],
    searchPlaceholder: "Search by name or artist...",
    filters,
    emptyMessage: "No albums found.",
    emptyCollectionMessage: "No albums in your collection yet.",
  },
} satisfies Meta<typeof CollectionPage<SampleAlbum>>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The full list page used by Albums, Wishlist, Guitars, Amplifiers and Pedals. */
export const Default: Story = {};

export const Loading: Story = {
  args: { isLoading: true },
};

export const EmptyCollection: Story = {
  args: { data: [] },
};

export const SearchOnly: Story = {
  args: { filters: undefined, actions: undefined },
};
