import type { Meta, StoryObj } from "@storybook/react-vite";
import { GenreCell } from "./GenreCell";

const meta = {
  title: "Music/GenreCell",
  component: GenreCell,
  args: {
    albumId: "story-album",
    genres: ["Rock"],
    knownGenres: ["Rock", "Progressive Rock", "Post-Rock", "Jazz", "Electronic", "Metal"],
  },
} satisfies Meta<typeof GenreCell>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Click "+", type "ro": known genres are suggested; Enter adds what you typed. */
export const Default: Story = {};

export const NoGenres: Story = {
  args: { genres: undefined },
};
