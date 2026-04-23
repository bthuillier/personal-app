import { useState, useMemo, type ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaginationControls, usePagination } from "@/components/Pagination";
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
  pageSize?: number;
  pageSizeOptions?: number[];
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

function isColumnSortable<T>(col: Column<T>): boolean {
  if (col.sortable !== undefined) return col.sortable;
  return !!col.accessor;
}

function nextSortState(
  prev: SortState | null,
  header: string,
): SortState | null {
  if (prev?.columnHeader !== header) {
    return { columnHeader: header, direction: "asc" };
  }
  return prev.direction === "asc"
    ? { columnHeader: header, direction: "desc" }
    : null;
}

function useSortedData<T>(data: T[], columns: Column<T>[]) {
  const [sort, setSort] = useState<SortState | null>(null);

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

  function toggleSort(col: Column<T>) {
    if (!isColumnSortable(col)) return;
    setSort((prev) => nextSortState(prev, col.header));
  }

  function sortIndicator(col: Column<T>): string {
    if (!isColumnSortable(col)) return "";
    if (sort?.columnHeader !== col.header) return " ↕";
    return sort.direction === "asc" ? " ↑" : " ↓";
  }

  return { sortedData, toggleSort, sortIndicator };
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  emptyMessage = "No data found.",
  pageSize: initialPageSize = 25,
  pageSizeOptions,
}: DataTableProps<T>) {
  const { sortedData, toggleSort, sortIndicator } = useSortedData(
    data,
    columns,
  );
  const pagination = usePagination(sortedData, initialPageSize);

  function renderCell(col: Column<T>, row: T): ReactNode {
    if (col.render) return col.render(row);
    if (col.accessor) return String(row[col.accessor] ?? "");
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead
                key={col.header}
                className={cn(
                  isColumnSortable(col) && "cursor-pointer select-none",
                )}
                onClick={() => toggleSort(col)}
              >
                {col.header}
                <span className="text-muted-foreground">
                  {sortIndicator(col)}
                </span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagination.pagedData.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="text-center text-muted-foreground py-8"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            pagination.pagedData.map((row) => (
              <TableRow key={rowKey(row)}>
                {columns.map((col) => (
                  <TableCell key={col.header}>{renderCell(col, row)}</TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {pagination.totalItems > 0 && (
        <PaginationControls
          pagination={pagination}
          pageSizeOptions={pageSizeOptions}
        />
      )}
    </div>
  );
}
