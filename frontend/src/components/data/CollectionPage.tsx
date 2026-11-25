import type { ReactNode } from "react";
import { Page } from "@/components/layout/Page";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingState } from "@/components/display/EmptyState";
import { DataTable, type Column } from "./DataTable";
import { FilterBar, type FilterOption } from "./FilterBar";

export interface CollectionPageProps<T> {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Header actions, e.g. an `ItemForm` to add an item. */
  actions?: ReactNode;

  data: T[];
  isLoading: boolean;

  columns: Column<T>[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;

  searchFields: (keyof T & string)[];
  searchPlaceholder?: string;
  filters?: FilterOption<T>[];

  /** Shown when search/filters match nothing. */
  emptyMessage: string;
  /** Shown when the collection itself is empty; defaults to `emptyMessage`. */
  emptyCollectionMessage?: string;
}

/** A list page: header, search + filters (kept in the URL) and a sortable, paginated table. */
export function CollectionPage<T>({
  title,
  subtitle,
  actions,
  data,
  isLoading,
  columns,
  rowKey,
  onRowClick,
  searchFields,
  searchPlaceholder,
  filters,
  emptyMessage,
  emptyCollectionMessage,
}: CollectionPageProps<T>) {
  return (
    <Page>
      <PageHeader title={title} subtitle={subtitle} actions={actions} />
      {isLoading ? (
        <LoadingState />
      ) : (
        <FilterBar
          data={data}
          searchFields={searchFields}
          searchPlaceholder={searchPlaceholder}
          filters={filters}
        >
          {(filtered) => (
            <DataTable
              columns={columns}
              data={filtered}
              rowKey={rowKey}
              onRowClick={onRowClick}
              emptyMessage={
                data.length === 0
                  ? (emptyCollectionMessage ?? emptyMessage)
                  : emptyMessage
              }
            />
          )}
        </FilterBar>
      )}
    </Page>
  );
}
