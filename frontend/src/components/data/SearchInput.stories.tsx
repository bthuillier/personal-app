import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { SearchInput } from "./SearchInput";

const meta = {
  title: "Data/SearchInput",
  component: SearchInput,
  args: {
    value: "",
    onChange: () => {},
    placeholder: "Search by name or artist...",
    suggestions: [
      "Pink Floyd",
      "Miles Davis",
      "Radiohead",
      "Daft Punk",
      "Metallica",
      "Nina Simone",
    ],
  },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SearchInput>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Type "a" to see the suggestions; arrow keys and Enter pick one. */
export const Default: Story = {
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <SearchInput {...args} value={value} onChange={setValue} />;
  },
};
