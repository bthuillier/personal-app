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

/**
 * A form's value object: every field is edited as a string (dates as
 * `YYYY-MM-DD`, enums as their value), which matches the API's JSON bodies.
 */
type StringFields<T> = { [K in keyof T]?: string };

interface BaseField<T> {
  /** Checked against the submitted type: a typo is a compile error. */
  name: keyof T & string;
  label: string;
  required?: boolean;
}

interface TextField<T> extends BaseField<T> {
  type: "text";
}

interface DateField<T> extends BaseField<T> {
  type: "date";
}

interface SelectField<T> extends BaseField<T> {
  type: "select";
  options: readonly string[];
  /** Initial choice when creating; defaults to the first option. */
  defaultValue?: string;
}

export type FieldDefinition<T> = TextField<T> | DateField<T> | SelectField<T>;

interface ItemFormProps<T extends StringFields<T>> {
  fields: FieldDefinition<T>[];
  /** The form closes and resets only once this resolves; on error it stays open. */
  onSubmit: (values: T) => void | Promise<void>;
  submitLabel?: string;
  buttonLabel?: string;
  /**
   * Prefilled values, read once on mount. In collapsible mode, providing them
   * also opens the form right away.
   */
  initialValues?: Partial<T>;
  /** Called when the user clicks Cancel. */
  onCancel?: () => void;
  /**
   * `true` (default): a "+ Add" button that opens the form, which closes and
   * resets after a successful submit — for creating items.
   * `false`: the form is always shown and Save stays disabled until a value
   * changes — for editing an existing item; the parent decides when to hide it.
   */
  collapsible?: boolean;
}

function defaultValues<T>(fields: FieldDefinition<T>[]): Record<string, string> {
  return Object.fromEntries(
    fields.map((f) => [
      f.name,
      f.type === "select" ? (f.defaultValue ?? f.options[0]) : "",
    ]),
  );
}

export function ItemForm<T extends StringFields<T>>({
  fields,
  onSubmit,
  submitLabel = "Save",
  buttonLabel = "+ Add",
  initialValues,
  onCancel,
  collapsible = true,
}: ItemFormProps<T>) {
  const [open, setOpen] = useState(!collapsible || !!initialValues);
  const [values, setValues] = useState<Record<string, string>>(() => ({
    ...defaultValues(fields),
    ...initialValues,
  }));

  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Every key comes from `fields`, whose names are keys of T.
      await onSubmit(values as T);
      if (collapsible) {
        setValues(defaultValues(fields));
        setOpen(false);
      }
    } catch {
      // The error toast is shown by the mutation cache; keep the input.
    } finally {
      setSubmitting(false);
    }
  }

  function updateValue(name: string, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  const unchanged =
    !collapsible &&
    fields.every((f) => values[f.name] === (initialValues?.[f.name] ?? ""));

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
      <div className="ml-auto flex gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={submitting}
          onClick={() => {
            if (collapsible) {
              setValues(defaultValues(fields));
              setOpen(false);
            }
            onCancel?.();
          }}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={submitting || unchanged}>
          {submitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
