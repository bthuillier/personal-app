import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { StarRating } from "./StarRating";

const meta = {
  title: "Display/StarRating",
  component: StarRating,
  args: { value: 7, readOnly: true },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 10, step: 1 } },
  },
} satisfies Meta<typeof StarRating>;

export default meta;
type Story = StoryObj<typeof meta>;

/** `value` is in half-stars: 0–10. */
export const ReadOnly: Story = {};

export const WithoutLabel: Story = {
  args: { showLabel: false, size: 14 },
};

export const Large: Story = {
  args: { size: 32 },
};

export const Interactive: Story = {
  args: { readOnly: false },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <StarRating {...args} value={value} onChange={setValue} />;
  },
};
