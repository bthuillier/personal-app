import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@/components/ui/button";
import { ListRow, ListRows } from "@/components/display/ListRow";
import { Section } from "./Section";

const meta = {
  title: "Layout/Section",
  component: Section,
  args: {
    title: "On the way",
    children: (
      <ListRows>
        <ListRow>
          <span className="font-medium">Blue Train</span>{" "}
          <span className="text-muted-foreground">by John Coltrane</span>
        </ListRow>
        <ListRow>
          <span className="font-medium">Kind of Blue</span>{" "}
          <span className="text-muted-foreground">by Miles Davis</span>
        </ListRow>
      </ListRows>
    ),
  },
} satisfies Meta<typeof Section>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithActions: Story = {
  args: {
    actions: (
      <Button variant="ghost" size="sm">
        See all
      </Button>
    ),
  },
};
