import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { amplifiersQuery } from "@/features/gear/api";
import type { Column } from "@/components/data/DataTable";
import { CollectionPage } from "@/components/data/CollectionPage";
import type { FilterOption } from "@/components/data/FilterBar";
import { StatusBadge } from "@/components/display/StatusBadge";
import { formatEnum } from "@/lib/utils";
import { ampTypes, type AmpType, type Amplifier } from "@/features/gear/types";


const searchFields: (keyof Amplifier & string)[] = ["model", "brand"];

const typeColorMap: Record<AmpType, "default" | "secondary" | "outline"> = {
  Tube: "default",
  SolidState: "secondary",
};

export function AmplifierListPage() {
  const query = useQuery(amplifiersQuery);

  const filters: FilterOption<Amplifier>[] = useMemo(
    () => [
      {
        name: "brand",
        label: "Brand",
        extract: (row: Amplifier) => row.brand,
      },
      {
        name: "type",
        label: "Type",
        options: ampTypes,
      },
    ],
    [],
  );

  const columns: Column<Amplifier>[] = [
    { header: "Model", accessor: "model", primary: true },
    { header: "Brand", accessor: "brand", render: (row) => formatEnum(row.brand) },
    { header: "Year", accessor: "year" },
    {
      header: "Wattage",
      render: (row) => `${row.wattage}W`,
      sortFn: (a, b) => a.wattage - b.wattage,
    },
    {
      header: "Type",
      render: (row) => (
        <StatusBadge status={row.type} colorMap={typeColorMap} />
      ),
    },
  ];

  return (
    <CollectionPage
      title="Amplifiers"
      query={query}
      columns={columns}
      rowKey={(a) => a.id}
      searchFields={searchFields}
      searchPlaceholder="Search by model or brand..."
      filters={filters}
      emptyMessage="No amplifiers found."
    />
  );
}
