import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { components } from "@/api/schema";
import { pedalsQuery } from "@/api/queries";
import { DataTable, type Column } from "@/components/DataTable";
import { FilterBar, type FilterOption } from "@/components/FilterBar";
import { StatusBadge } from "@/components/StatusBadge";
import { formatEnum } from "@/lib/utils";

type GuitarPedal = components["schemas"]["GuitarPedal"];
type PedalType = components["schemas"]["PedalType"];

const searchFields: (keyof GuitarPedal & string)[] = ["model", "brand"];

const pedalTypeColorMap: Record<PedalType, "default" | "secondary" | "outline" | "destructive"> = {
  Distortion: "destructive",
  Overdrive: "destructive",
  Fuzz: "destructive",
  Preamp: "default",
  Boost: "default",
  PowerAmplifier: "default",
  Delay: "secondary",
  Reverb: "secondary",
  Chorus: "secondary",
  NoiseGate: "outline",
  Tuner: "outline",
  Splitter: "outline",
};

export function PedalListPage() {
  const { data: pedals = [], isLoading } = useQuery(pedalsQuery);

  const filters: FilterOption<GuitarPedal>[] = useMemo(
    () => [
      {
        name: "brand",
        label: "Brand",
        extract: (row: GuitarPedal) => row.brand,
      },
      {
        name: "type",
        label: "Type",
        extract: (row: GuitarPedal) => row.type,
      },
    ],
    [],
  );

  const columns: Column<GuitarPedal>[] = [
    { header: "Model", accessor: "model" },
    { header: "Brand", accessor: "brand", render: (row) => formatEnum(row.brand) },
    { header: "Year", accessor: "year" },
    {
      header: "Type",
      render: (row) => (
        <StatusBadge status={row.type} colorMap={pedalTypeColorMap} />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Pedals</h2>
      </div>
      {isLoading && (
        <p className="text-sm text-muted-foreground">Loading...</p>
      )}
      {!isLoading && (
        <FilterBar
          data={pedals}
          searchPlaceholder="Search by model or brand..."
          searchFields={searchFields}
          filters={filters}
        >
          {(filtered) => (
            <DataTable
              columns={columns}
              data={filtered}
              rowKey={(p) => p.serialNumber}
              emptyMessage="No pedals found."
            />
          )}
        </FilterBar>
      )}
    </div>
  );
}
