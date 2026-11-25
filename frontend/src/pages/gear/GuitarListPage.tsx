import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import type { components } from "@/api/schema";
import { guitarsQuery } from "@/api/queries";
import type { Column } from "@/components/data/DataTable";
import { CollectionPage } from "@/components/data/CollectionPage";
import type { FilterOption } from "@/components/data/FilterBar";
import { TuningBadge } from "@/pages/gear/TuningBadge";
import { formatEnum } from "@/lib/utils";

type Guitar = components["schemas"]["Guitar"];

const searchFields: (keyof Guitar & string)[] = ["model", "brand"];

export function GuitarListPage() {
  const navigate = useNavigate();
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
      primary: true,
      render: (row) => `${formatEnum(row.brand)} ${row.model}`,
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
    <CollectionPage
      title="Guitars"
      data={guitars}
      isLoading={isLoading}
      columns={columns}
      rowKey={(g) => g.id}
      onRowClick={(g) => navigate(`/gear/guitars/${encodeURIComponent(g.id)}`)}
      searchFields={searchFields}
      searchPlaceholder="Search by model or brand..."
      filters={filters}
      emptyMessage="No guitars found."
    />
  );
}
