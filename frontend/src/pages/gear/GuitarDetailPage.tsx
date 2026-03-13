import { useMemo } from "react";
import { useParams, Link } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { components } from "@/api/schema";
import { api } from "@/api/client";
import { ItemForm, type FieldDefinition } from "@/components/ItemForm";
import { DataTable, type Column } from "@/components/DataTable";
import { TuningBadge } from "@/components/TuningBadge";
import { formatEnum } from "@/lib/utils";

type GuitarEvent = components["schemas"]["GuitarEvent"];

function formatGauge(gauge?: number[]): string {
  if (!gauge || gauge.length === 0) return "-";
  return gauge.join("-");
}

function formatPickup(pickup?: components["schemas"]["Pickup"]) {
  if (!pickup) return "-";
  return `${formatEnum(pickup.brand)} ${pickup.model} (${formatEnum(pickup.type)})`;
}

function formatMaterials(materials?: components["schemas"]["GuitarMaterial"][]): string {
  if (!materials || materials.length === 0) return "-";
  return materials.map(formatEnum).join(" | ");
}

const changeStringsFields: FieldDefinition[] = [
  { name: "date", label: "Date", type: "date" },
  { name: "stringBrand", label: "String Brand", type: "text" },
  { name: "stringGauge", label: "Gauge (e.g. 10-46)", type: "text" },
];

export function GuitarDetailPage() {
  const { serial } = useParams<{ serial: string }>();
  const queryClient = useQueryClient();

  const { data: guitars = [] } = useQuery({
    queryKey: ["guitars"],
    queryFn: async () => {
      const { data } = await api.GET("/guitars");
      return data!;
    },
  });

  const guitar = useMemo(
    () => guitars.find((g) => g.serialNumber === serial),
    [guitars, serial],
  );

  const { data: events = [] } = useQuery({
    queryKey: ["guitar-events", serial],
    queryFn: async () => {
      const { data } = await api.GET("/guitars/{serialNumber}/events", {
        params: { path: { serialNumber: serial! } },
      });
      return data!;
    },
    enabled: !!serial,
  });

  const changeStringsMutation = useMutation({
    mutationFn: async (body: components["schemas"]["ChangeStrings"]) => {
      await api.POST("/guitars/{serialNumber}/commands", {
        params: { path: { serialNumber: serial! } },
        body,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guitars"] });
      queryClient.invalidateQueries({ queryKey: ["guitar-events", serial] });
    },
  });

  async function handleChangeStrings(values: Record<string, string>) {
    const gauge = values.stringGauge
      ? values.stringGauge.split(/[-,\s]+/).map(Number).filter((n) => !isNaN(n))
      : undefined;

    await changeStringsMutation.mutateAsync({
      date: values.date,
      stringBrand: values.stringBrand,
      stringGauge: gauge,
      tuning: guitar?.setup.tuning ?? { notes: [] },
    });
  }

  if (!guitar) {
    return (
      <div className="flex flex-col gap-4">
        <Link to="/gear/guitars" className="text-sm text-muted-foreground hover:text-foreground">
          &larr; Back to Guitars
        </Link>
        <p className="text-sm text-muted-foreground">Guitar not found.</p>
      </div>
    );
  }

  const { specifications: specs, setup } = guitar;

  const eventColumns: Column<GuitarEvent>[] = [
    { header: "Date", accessor: "date" },
    { header: "Strings", accessor: "stringBrand" },
    {
      header: "Gauge",
      render: (row) => formatGauge(row.stringGauge),
      sortable: false,
    },
    {
      header: "Tuning",
      render: (row) => <TuningBadge tuning={row.tuning} />,
      sortable: false,
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <Link to="/gear/guitars" className="text-sm text-muted-foreground hover:text-foreground">
            &larr; Back to Guitars
          </Link>
          <h2 className="text-xl font-semibold">
            {formatEnum(guitar.brand)} {guitar.model}
          </h2>
          <p className="text-sm text-muted-foreground">
            {guitar.year} &middot; S/N: {guitar.serialNumber}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Specifications */}
        <section className="rounded-lg border border-border p-5">
          <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Specifications
          </h3>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Body</dt>
            <dd>{formatEnum(specs.bodyMaterial)} — {specs.bodyFinish}</dd>
            {specs.top && (
              <>
                <dt className="text-muted-foreground">Top</dt>
                <dd>{formatEnum(specs.top)}</dd>
              </>
            )}
            {specs.neckMaterial && specs.neckMaterial.length > 0 && (
              <>
                <dt className="text-muted-foreground">Neck</dt>
                <dd>{formatMaterials(specs.neckMaterial)}</dd>
              </>
            )}
            <dt className="text-muted-foreground">Fretboard</dt>
            <dd>{formatEnum(specs.fretboardMaterial)}</dd>
            <dt className="text-muted-foreground">Frets</dt>
            <dd>{specs.numberOfFrets}</dd>
            <dt className="text-muted-foreground">Scale Length</dt>
            <dd>{specs.scaleLengthInInches}&quot;</dd>
            <dt className="text-muted-foreground">Strings</dt>
            <dd>{specs.numberOfStrings}</dd>
            <dt className="text-muted-foreground">Bridge Pickup</dt>
            <dd>{formatPickup(specs.pickupConfiguration.bridgePickup)}</dd>
            {specs.pickupConfiguration.neckPickup && (
              <>
                <dt className="text-muted-foreground">Neck Pickup</dt>
                <dd>{formatPickup(specs.pickupConfiguration.neckPickup)}</dd>
              </>
            )}
            {specs.pickupConfiguration.middlePickup && (
              <>
                <dt className="text-muted-foreground">Middle Pickup</dt>
                <dd>{formatPickup(specs.pickupConfiguration.middlePickup)}</dd>
              </>
            )}
          </dl>
        </section>

        {/* Current Setup */}
        <section className="rounded-lg border border-border p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Current Setup
            </h3>
            <ItemForm
              fields={changeStringsFields}
              onSubmit={handleChangeStrings}
              buttonLabel="Change Strings"
              submitLabel="Save"
            />
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Strings</dt>
            <dd>{setup.stringBrand}</dd>
            <dt className="text-muted-foreground">Gauge</dt>
            <dd>{formatGauge(setup.stringGauge)}</dd>
            <dt className="text-muted-foreground">Tuning</dt>
            <dd>
              <TuningBadge tuning={setup.tuning} />
            </dd>
            <dt className="text-muted-foreground">Last Change</dt>
            <dd>{setup.lastStringChange}</dd>
          </dl>
        </section>
      </div>

      {/* Event History */}
      <section>
        <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          String Change History
        </h3>
        <DataTable
          columns={eventColumns}
          data={events}
          rowKey={(e) => `${e.date}-${e.stringBrand}`}
          emptyMessage="No string changes recorded."
        />
      </section>
    </div>
  );
}
