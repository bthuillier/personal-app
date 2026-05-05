import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import type { components } from "@/api/schema";
import { guitarsQuery } from "@/api/queries";
import { DataTable, type Column } from "@/components/DataTable";
import { FilterBar, type FilterOption } from "@/components/FilterBar";
import { TuningBadge } from "@/components/TuningBadge";
import { formatEnum } from "@/lib/utils";

type Guitar = components["schemas"]["Guitar"];

const searchFields: (keyof Guitar & string)[] = ["model", "brand"];

export function GuitarListPage() {
  const { data: guitars = [], isLoading } = useQuery(guitarsQuery);

  const filters: FilterOption<Guitar>[] = useMemo(
    () => [
      {
        name: "brand",
        label: "Brand",
        extract: (row: Guitar) => row.brand,
      },
      {
        name: "numberOfStrings",
        label: "String Count",
        extract: (row: Guitar) => String(row.specifications.numberOfStrings),
      },
    ],
    [],
  );

  const columns: Column<Guitar>[] = [
    {
      header: "Guitar",
      accessor: "model",
      truncate: true,
      render: (row) => {
        const label = `${formatEnum(row.brand)} ${row.model}`;
        return (
          <Link
            to={`/gear/guitars/${encodeURIComponent(row.id)}`}
            title={label}
            className="text-primary underline-offset-4 hover:underline"
          >
            {label}
          </Link>
        );
      },
    },
    { header: "Year", accessor: "year" },
    {
      header: "Strings",
      render: (row) => row.specifications.numberOfStrings,
      sortFn: (a, b) =>
        a.specifications.numberOfStrings - b.specifications.numberOfStrings,
    },
    {
      header: "Tuning",
      render: (row) => <TuningBadge tuning={row.setup.tuning} />,
      sortable: false,
    },
    {
      header: "Last String Change",
      render: (row) => row.setup.lastStringChange,
      sortFn: (a, b) =>
        a.setup.lastStringChange.localeCompare(b.setup.lastStringChange),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Guitars</h2>
      </div>
      {isLoading && (
        <p className="text-sm text-muted-foreground">Loading...</p>
      )}
      {!isLoading && (
        <FilterBar
          data={guitars}
          searchPlaceholder="Search by model or brand..."
          searchFields={searchFields}
          filters={filters}
        >
          {(filtered) => (
            <DataTable
              columns={columns}
              data={filtered}
              rowKey={(g) => g.id}
              emptyMessage="No guitars found."
            />
          )}
        </FilterBar>
      )}
    </div>
  );
}
