import type { Meta, StoryObj } from "@storybook/react-vite";
import { EmptyState, LoadingState } from "./EmptyState";

const meta = {
  title: "Display/EmptyState",
  component: EmptyState,
  args: { children: "No albums released in 2026 in your collection." },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Loading: Story = {
  render: () => <LoadingState />,
};
