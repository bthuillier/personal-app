import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "@/components/ui/badge";
import { DescriptionList } from "./DescriptionList";

const meta = {
  title: "Display/DescriptionList",
  component: DescriptionList,
  args: {
    items: [
      { label: "Body", value: "Mahogany — Cherry Sunburst" },
      { label: "Fretboard", value: "Rosewood" },
      { label: "Frets", value: 22 },
      { label: "Scale Length", value: '24.75"' },
      { label: "Tuning", value: <Badge variant="secondary">Drop D</Badge> },
    ],
  },
} satisfies Meta<typeof DescriptionList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** `null`, `undefined` and `false` hide a row; `0` is still shown. */
export const HiddenRows: Story = {
  args: {
    items: [
      { label: "Body", value: "Alder" },
      { label: "Top", value: null },
      { label: "Neck Pickup", value: undefined },
      { label: "Middle Pickup", value: false },
      { label: "Capo", value: 0 },
    ],
  },
};
