import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { MarkdownView, ReviewEditor } from "./ReviewEditor";

const review = {
  title: "A late-night classic",
  rating: 9,
  description: `Modal jazz at its best.

- **So What** sets the tone
- *Blue in Green* is pure atmosphere

| Side | Tracks |
| ---- | ------ |
| A    | 3      |
| B    | 2      |`,
};

const meta = {
  title: "Music/ReviewEditor",
  component: ReviewEditor,
  args: { onSave: fn(), onCancel: fn() },
} satisfies Meta<typeof ReviewEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NewReview: Story = {};

export const EditExisting: Story = {
  args: { initial: review },
};

/** Read-only rendering used on the album page (GitHub-flavored Markdown). */
export const Markdown: Story = {
  render: () => <MarkdownView source={review.description} />,
};
