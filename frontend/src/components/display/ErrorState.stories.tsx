import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { ErrorState } from "./ErrorState";

const meta = {
  title: "Display/ErrorState",
  component: ErrorState,
  args: {
    error: new Error("Something went wrong on the server."),
    onRetry: fn(),
  },
} satisfies Meta<typeof ErrorState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutRetry: Story = {
  args: { onRetry: undefined, title: "Album not found", error: undefined },
};
