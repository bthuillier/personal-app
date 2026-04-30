import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TextField {
  name: string;
  label: string;
  type: "text";
  required?: boolean;
}

interface DateField {
  name: string;
  label: string;
  type: "date";
  required?: boolean;
}

interface SelectField {
  name: string;
  label: string;
  type: "select";
  options: string[];
  required?: boolean;
}

export type FieldDefinition = TextField | DateField | SelectField;

interface ItemFormProps {
  fields: FieldDefinition[];
  onSubmit: (values: Record<string, string>) => void;
  submitLabel?: string;
  buttonLabel?: string;
  /**
   * Optional prefilled values. When provided, the form opens prefilled with
   * these values; subsequent changes to `initialValues` re-prefill the form
   * (useful when an external action — e.g. "Apply recommendation" — wants to
   * push new values into an already-open form).
   */
  initialValues?: Record<string, string>;
}

function defaultValues(fields: FieldDefinition[]): Record<string, string> {
  return Object.fromEntries(
    fields.map((f) => [f.name, f.type === "select" ? f.options[0] : ""]),
  );
}

export function ItemForm({
  fields,
  onSubmit,
  submitLabel = "Save",
  buttonLabel = "+ Add",
  initialValues,
}: ItemFormProps) {
  const [open, setOpen] = useState(!!initialValues);
  const [values, setValues] = useState<Record<string, string>>(() => ({
    ...defaultValues(fields),
    ...initialValues,
  }));

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit(values);
    setValues(defaultValues(fields));
    setOpen(false);
  }

  function updateValue(name: string, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        {buttonLabel}
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-muted/30 p-4"
    >
      {fields.map((field) => (
        <div key={field.name} className="flex flex-col gap-1.5">
          <Label htmlFor={field.name}>{field.label}</Label>
          {field.type === "text" && (
            <Input
              id={field.name}
              required={field.required !== false}
              value={values[field.name]}
              onChange={(e) => updateValue(field.name, e.target.value)}
            />
          )}
          {field.type === "date" && (
            <Input
              id={field.name}
              type="date"
              required={field.required !== false}
              value={values[field.name]}
              onChange={(e) => updateValue(field.name, e.target.value)}
            />
          )}
          {field.type === "select" && (
            <Select
              value={values[field.name]}
              onValueChange={(val) => { if (val != null) updateValue(field.name, val); }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {field.options.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      ))}
      <div className="flex gap-2">
        <Button type="submit">{submitLabel}</Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
