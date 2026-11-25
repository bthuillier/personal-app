import type { Meta, StoryObj } from "@storybook/react-vite";
import { BarList } from "./BarList";
import { StatCard, StatGrid } from "./StatCard";

const meta = {
  title: "Display/StatCard",
  component: StatCard,
  args: { label: "Albums", value: 128, detail: "96 Vinyl · 32 CD" },
} satisfies Meta<typeof StatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AsLink: Story = {
  args: { to: "/music/albums" },
};

export const ValueOnly: Story = {
  args: { label: "Pedals", detail: undefined, value: 14 },
};

export const CustomContent: Story = {
  args: {
    label: "Top genres",
    value: undefined,
    detail: undefined,
    children: (
      <div className="mt-3">
        <BarList
          items={[
            { label: "Rock", count: 42 },
            { label: "Jazz", count: 18 },
            { label: "Metal", count: 9 },
          ]}
        />
      </div>
    ),
  },
};

export const Grid: Story = {
  render: () => (
    <StatGrid>
      <StatCard to="/music/albums" label="Albums" value={128} detail="96 Vinyl · 32 CD" />
      <StatCard to="/music/wishlist" label="Wishlist" value={7} detail="5 wanted · 2 ordered" />
      <StatCard label="Uncategorized" value={3} detail="albums need a genre" />
      <StatCard label="Reviewed" value={54} detail="74 left to review" />
    </StatGrid>
  ),
};

export const GridThreeColumns: Story = {
  render: () => (
    <StatGrid columns={3}>
      <StatCard to="/gear/guitars" label="Guitars" value={6} />
      <StatCard to="/gear/amplifiers" label="Amplifiers" value={2} />
      <StatCard to="/gear/pedals" label="Pedals" value={14} />
    </StatGrid>
  ),
};
