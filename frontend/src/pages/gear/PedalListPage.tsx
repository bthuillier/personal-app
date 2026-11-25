import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { components } from "@/api/schema";
import { pedalsQuery } from "@/api/queries";
import type { Column } from "@/components/data/DataTable";
import { CollectionPage } from "@/components/data/CollectionPage";
import type { FilterOption } from "@/components/data/FilterBar";
import { StatusBadge } from "@/components/display/StatusBadge";
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
    { header: "Model", accessor: "model", primary: true },
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
    <CollectionPage
      title="Pedals"
      data={pedals}
      isLoading={isLoading}
      columns={columns}
      rowKey={(p) => p.id}
      searchFields={searchFields}
      searchPlaceholder="Search by model or brand..."
      filters={filters}
      emptyMessage="No pedals found."
    />
  );
}
