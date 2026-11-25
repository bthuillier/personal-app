import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@/components/ui/button";
import { DescriptionList } from "./DescriptionList";
import { Panel } from "./Panel";

const meta = {
  title: "Display/Panel",
  component: Panel,
  args: {
    title: "Current Setup",
    children: (
      <DescriptionList
        items={[
          { label: "Strings", value: "D'Addario NYXL" },
          { label: "Gauge", value: "10-46" },
          { label: "Last Change", value: "2026-10-12" },
        ]}
      />
    ),
  },
} satisfies Meta<typeof Panel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithActions: Story = {
  args: { actions: <Button>Change Strings</Button> },
};

export const WithDescription: Story = {
  args: {
    title: "Try Another Tuning",
    description:
      "Find NYXL gauges that match the current setup's tension on a different tuning.",
  },
};

export const Untitled: Story = {
  args: { title: undefined, children: <p className="text-sm">Plain content.</p> },
};
