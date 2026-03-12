import { useState, useMemo, type ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface Column<T> {
  header: string;
  accessor?: keyof T & string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  sortFn?: (a: T, b: T) => number;
}

type SortDirection = "asc" | "desc";

interface SortState {
  columnHeader: string;
  direction: SortDirection;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
}

function defaultCompare<T>(a: T, b: T, accessor: keyof T & string): number {
  const aVal = a[accessor];
  const bVal = b[accessor];
  if (aVal == null && bVal == null) return 0;
  if (aVal == null) return -1;
  if (bVal == null) return 1;
  if (typeof aVal === "number" && typeof bVal === "number") return aVal - bVal;
  return String(aVal).localeCompare(String(bVal));
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  emptyMessage = "No data found.",
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState | null>(null);

  function handleSort(col: Column<T>) {
    if (!col.sortable && !col.accessor) return;
    if (col.sortable === false) return;

    setSort((prev) => {
      if (prev?.columnHeader === col.header) {
        return prev.direction === "asc"
          ? { columnHeader: col.header, direction: "desc" }
          : null;
      }
      return { columnHeader: col.header, direction: "asc" };
    });
  }

  const sortedData = useMemo(() => {
    if (!sort) return data;
    const col = columns.find((c) => c.header === sort.columnHeader);
    if (!col) return data;

    const sorted = [...data].sort((a, b) => {
      if (col.sortFn) return col.sortFn(a, b);
      if (col.accessor) return defaultCompare(a, b, col.accessor);
      return 0;
    });

    return sort.direction === "desc" ? sorted.reverse() : sorted;
  }, [data, sort, columns]);

  function isSortable(col: Column<T>): boolean {
    if (col.sortable !== undefined) return col.sortable;
    return !!col.accessor;
  }

  function sortIndicator(col: Column<T>): string {
    if (!isSortable(col)) return "";
    if (sort?.columnHeader !== col.header) return " ↕";
    return sort.direction === "asc" ? " ↑" : " ↓";
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead
              key={col.header}
              className={cn(isSortable(col) && "cursor-pointer select-none")}
              onClick={() => handleSort(col)}
            >
              {col.header}
              <span className="text-muted-foreground">{sortIndicator(col)}</span>
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedData.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={columns.length}
              className="text-center text-muted-foreground py-8"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          sortedData.map((row) => (
            <TableRow key={rowKey(row)}>
              {columns.map((col) => (
                <TableCell key={col.header}>
                  {col.render
                    ? col.render(row)
                    : col.accessor
                      ? String(row[col.accessor] ?? "")
                      : null}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
