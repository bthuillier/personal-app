import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@/components/ui/button";
import { PageHeader } from "./PageHeader";

const meta = {
  title: "Layout/PageHeader",
  component: PageHeader,
  args: { title: "Albums" },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithSubtitle: Story = {
  args: { title: "Music", subtitle: "Your music collection at a glance" },
};

export const WithActions: Story = {
  args: { actions: <Button>+ Add Album</Button> },
};

export const DetailPage: Story = {
  args: {
    back: { to: "/music/albums", label: "Back to Albums" },
    title: "The Dark Side of the Moon",
    subtitle: "Pink Floyd · Vinyl · 1973-03-01",
    actions: (
      <Button variant="outline" size="sm">
        Edit Details
      </Button>
    ),
  },
};

export const LongTitle: Story = {
  args: {
    title:
      "Sgt. Pepper's Lonely Hearts Club Band (Super Deluxe Edition, 50th Anniversary Remix)",
    subtitle: "The Beatles · CD · 1967-05-26",
    actions: <Button>Action</Button>,
  },
};
