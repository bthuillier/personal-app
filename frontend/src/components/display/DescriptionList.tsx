import type { ReactNode } from "react";

export interface DescriptionItem {
  label: string;
  /** `null`, `undefined` and `false` hide the row; `0` and `""` are shown. */
  value: ReactNode;
}

export function DescriptionList({ items }: { items: DescriptionItem[] }) {
  const visible = items.filter(
    (item) => item.value !== null && item.value !== undefined && item.value !== false,
  );
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
      {visible.map((item) => (
        <div key={item.label} className="contents">
          <dt className="text-muted-foreground">{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
