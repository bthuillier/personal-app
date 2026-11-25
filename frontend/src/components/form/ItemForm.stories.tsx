import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { ItemForm, type FieldDefinition } from "./ItemForm";

const albumFields: FieldDefinition[] = [
  { name: "name", label: "Album", type: "text" },
  { name: "artist", label: "Artist", type: "text" },
  { name: "format", label: "Format", type: "select", options: ["Vinyl", "CD"] },
  { name: "releaseDate", label: "Release Date", type: "date" },
];

const meta = {
  title: "Form/ItemForm",
  component: ItemForm,
  args: {
    fields: albumFields,
    onSubmit: fn(),
    buttonLabel: "+ Add Album",
    submitLabel: "Add Album",
  },
} satisfies Meta<typeof ItemForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Closed: a button that opens the form. */
export const Closed: Story = {};

/** `initialValues` opens the form prefilled. */
export const Prefilled: Story = {
  args: {
    initialValues: {
      name: "Kind of Blue",
      artist: "Miles Davis",
      format: "Vinyl",
      releaseDate: "1959-08-17",
    },
    onCancel: fn(),
  },
};

/** `collapsible={false}`: always open, Save disabled until a value changes. */
export const EditExisting: Story = {
  args: {
    collapsible: false,
    fields: [
      { name: "format", label: "Format", type: "select", options: ["Vinyl", "CD"] },
      { name: "releaseDate", label: "Release Date", type: "date" },
    ],
    initialValues: { format: "Vinyl", releaseDate: "1959-08-17" },
    submitLabel: "Save",
    onCancel: fn(),
  },
};
