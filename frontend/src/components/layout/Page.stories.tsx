import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@/components/ui/button";
import { StatCard, StatGrid } from "@/components/display/StatCard";
import { Page } from "./Page";
import { PageHeader } from "./PageHeader";
import { Section } from "./Section";

const meta = {
  title: "Layout/Page",
  component: Page,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Page>;

export default meta;
type Story = StoryObj<typeof meta>;

/** How the building blocks stack on a typical page. */
export const Composition: Story = {
  args: {
    children: (
      <>
        <PageHeader
          title="Music"
          subtitle="Your music collection at a glance"
          actions={<Button>+ Add Album</Button>}
        />
        <StatGrid>
          <StatCard label="Albums" value={128} detail="96 Vinyl · 32 CD" />
          <StatCard label="Wishlist" value={7} detail="5 wanted · 2 ordered" />
          <StatCard label="Uncategorized" value={3} detail="albums need a genre" />
          <StatCard label="Reviewed" value={54} detail="74 left to review" />
        </StatGrid>
        <Section title="On the way">
          <p className="text-sm text-muted-foreground">Section content…</p>
        </Section>
      </>
    ),
  },
};
