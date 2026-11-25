import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatusBadge } from "./StatusBadge";

type WishlistStatus = "Wanted" | "Ordered" | "Received";

const colorMap: Record<WishlistStatus, "default" | "secondary" | "outline"> = {
  Wanted: "outline",
  Ordered: "secondary",
  Received: "default",
};

const meta = {
  title: "Display/StatusBadge",
  component: StatusBadge,
  args: { status: "Ordered", colorMap },
  argTypes: {
    status: { control: "inline-radio", options: Object.keys(colorMap) },
  },
} satisfies Meta<typeof StatusBadge<WishlistStatus>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-2">
      {(Object.keys(colorMap) as WishlistStatus[]).map((status) => (
        <StatusBadge key={status} status={status} colorMap={colorMap} />
      ))}
      <StatusBadge
        status="PowerAmplifier"
        colorMap={{ PowerAmplifier: "destructive" }}
      />
    </div>
  ),
};
