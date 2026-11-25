import type { Meta, StoryObj } from "@storybook/react-vite";
import { ListRow, ListRows } from "./ListRow";

const meta = {
  title: "Display/ListRow",
  component: ListRow,
  args: {
    children: (
      <>
        <span className="font-medium">Blue Train</span>{" "}
        <span className="text-muted-foreground">by John Coltrane</span>
      </>
    ),
  },
} satisfies Meta<typeof ListRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Static: Story = {};

export const AsLink: Story = {
  args: { to: "/music/albums/abc" },
};

export const Stacked: Story = {
  render: () => (
    <ListRows>
      {["Blue Train", "Kind of Blue", "A Love Supreme"].map((name) => (
        <ListRow key={name} to="/music/albums/abc">
          <span className="font-medium">{name}</span>
        </ListRow>
      ))}
    </ListRows>
  ),
};
