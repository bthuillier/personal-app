import type { Meta, StoryObj } from "@storybook/react-vite";
import { formatEnum } from "@/lib/utils";
import { BarList } from "./BarList";

const meta = {
  title: "Display/BarList",
  component: BarList,
  args: {
    items: [
      { label: "Rock", count: 42 },
      { label: "Progressive Rock", count: 25 },
      { label: "Jazz", count: 18 },
      { label: "Metal", count: 9 },
      { label: "Electronic", count: 2 },
    ],
  },
  decorators: [
    (Story) => (
      <div className="max-w-xs">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BarList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithLinks: Story = {
  args: { href: (label) => `/music/albums?genre=${encodeURIComponent(label)}` },
};

/** Links use the raw value (`?type=NoiseGate`), the label is formatted. */
export const FormattedLabels: Story = {
  args: {
    items: [
      { label: "Overdrive", count: 4 },
      { label: "NoiseGate", count: 2 },
      { label: "PowerAmplifier", count: 1 },
    ],
    formatLabel: formatEnum,
    href: (label) => `/gear/pedals?type=${label}`,
  },
};

export const Empty: Story = {
  args: { items: [] },
};
