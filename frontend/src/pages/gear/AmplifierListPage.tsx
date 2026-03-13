import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { components } from "@/api/schema";
import { api } from "@/api/client";
import { DataTable, type Column } from "@/components/DataTable";
import { FilterBar, type FilterOption } from "@/components/FilterBar";
import { StatusBadge } from "@/components/StatusBadge";

type Amplifier = components["schemas"]["Amplifier"];
type AmpType = components["schemas"]["AmpType"];

const searchFields: (keyof Amplifier & string)[] = ["model", "brand"];

const typeColorMap: Record<AmpType, "default" | "secondary" | "outline"> = {
  Tube: "default",
  SolidState: "secondary",
};

export function AmplifierListPage() {
  const [displayed, setDisplayed] = useState<Amplifier[]>([]);

  const { data: amplifiers = [], isLoading } = useQuery({
    queryKey: ["amplifiers"],
    queryFn: async () => {
      const { data } = await api.GET("/amplifiers");
      return data!;
    },
  });

  const handleFiltered = useCallback((filtered: Amplifier[]) => {
    setDisplayed(filtered);
  }, []);

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
        options: ["Tube", "SolidState"],
      },
    ],
    [],
  );

  const columns: Column<Amplifier>[] = [
    { header: "Model", accessor: "model" },
    { header: "Brand", accessor: "brand" },
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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Amplifiers</h2>
      </div>
      {isLoading && (
        <p className="text-sm text-muted-foreground">Loading...</p>
      )}
      {!isLoading && (
        <>
          <FilterBar
            data={amplifiers}
            searchPlaceholder="Search by model or brand..."
            searchFields={searchFields}
            filters={filters}
            onFiltered={handleFiltered}
          />
          <DataTable
            columns={columns}
            data={displayed}
            rowKey={(a) => a.serialNumber}
            emptyMessage="No amplifiers found."
          />
        </>
      )}
    </div>
  );
}
