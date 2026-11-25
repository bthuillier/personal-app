import { useMemo, useState } from "react";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import type { components } from "@/api/schema";
import { guitarsQuery, guitarEventsQuery } from "@/api/queries";
import { useChangeGuitarStrings } from "@/api/mutations";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/data/DataTable";
import { TuningBadge } from "@/pages/gear/TuningBadge";
import { formatEnum } from "@/lib/utils";
import { formatGaugeList } from "@/lib/strings";
import { usePendingApply } from "@/hooks/usePendingApply";
import { Panel } from "@/components/display/Panel";
import { DescriptionList } from "@/components/display/DescriptionList";
import { BackLink, PageHeader } from "@/components/layout/PageHeader";
import { Page } from "@/components/layout/Page";
import { EmptyState } from "@/components/display/EmptyState";
import { QueryGate } from "@/components/data/QueryGate";
import { StringRecommendationPanel } from "./StringRecommendationPanel";
import {
  ChangeStringsDrawer,
  type ChangeStringsFormValues,
} from "./ChangeStringsDrawer";

type GuitarEvent = components["schemas"]["GuitarEvent"];
type StringsChanged = Extract<GuitarEvent, { stringBrand: string }>;
type GuitarTuning = components["schemas"]["GuitarTuning"];

function isStringsChanged(event: GuitarEvent): event is StringsChanged {
  return "stringBrand" in event;
}

const BACK = { to: "/gear/guitars", label: "Back to Guitars" };

export interface AppliedRecommendation {
  brand: string;
  gauges: number[];
  tuning: GuitarTuning;
}

function formatPickup(pickup?: components["schemas"]["Pickup"]) {
  if (!pickup) return "-";
  return `${formatEnum(pickup.brand)} ${pickup.model} (${formatEnum(pickup.type)})`;
}

function formatMaterials(materials?: components["schemas"]["GuitarMaterial"][]): string {
  if (!materials || materials.length === 0) return "-";
  return materials.map(formatEnum).join(" | ");
}

export function GuitarDetailPage() {
  const { id } = useParams<{ id: string }>();

  const guitarsResult = useQuery(guitarsQuery);
  const { data: guitars = [] } = guitarsResult;

  const guitar = useMemo(
    () => guitars.find((g) => g.id === id),
    [guitars, id],
  );

  const { data: events = [] } = useQuery(guitarEventsQuery(id!));

  const changeStringsMutation = useChangeGuitarStrings(id!);

  const pendingApply = usePendingApply();
  const [manualOpen, setManualOpen] = useState(false);
  const drawerOpen = manualOpen || !!pendingApply.pending;

  function handleDrawerOpenChange(open: boolean) {
    setManualOpen(open);
    if (!open) pendingApply.clear();
  }

  async function handleChangeStrings(values: ChangeStringsFormValues) {
    const gauge = values.stringGauge
      ? values.stringGauge
          .split(/[-,\s]+/)
          .map(Number)
          .filter((n: number) => !isNaN(n))
      : undefined;

    await changeStringsMutation.mutateAsync({
      type: "ChangeStrings",
      date: values.date,
      stringBrand: values.stringBrand,
      stringGauge: gauge,
      tuning: values.tuning,
    });
    pendingApply.clear();
  }

  if (!guitarsResult.isSuccess) return <QueryGate queries={[guitarsResult]} />;

  if (!guitar) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink {...BACK} />
        <EmptyState>Guitar not found.</EmptyState>
      </div>
    );
  }

  const { specifications: specs, setup } = guitar;

  const stringChangeEvents = events.filter(isStringsChanged);

  const eventColumns: Column<StringsChanged>[] = [
    { header: "Date", accessor: "date" },
    { header: "Strings", accessor: "stringBrand" },
    {
      header: "Gauge",
      render: (row) => formatGaugeList(row.stringGauge),
      sortable: false,
    },
    {
      header: "Tuning",
      render: (row) => <TuningBadge tuning={row.tuning} />,
      sortable: false,
    },
  ];

  return (
    <Page>
      <PageHeader
        back={BACK}
        title={`${formatEnum(guitar.brand)} ${guitar.model}`}
        subtitle={
          <>
            {guitar.year} &middot; S/N: {guitar.serialNumber}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Panel title="Specifications">
          <DescriptionList
            items={[
              { label: "Body", value: `${formatEnum(specs.bodyMaterial)} — ${specs.bodyFinish}` },
              { label: "Top", value: specs.top && formatEnum(specs.top) },
              {
                label: "Neck",
                value:
                  specs.neckMaterial && specs.neckMaterial.length > 0
                    ? formatMaterials(specs.neckMaterial)
                    : null,
              },
              { label: "Fretboard", value: formatEnum(specs.fretboardMaterial) },
              { label: "Frets", value: specs.numberOfFrets },
              { label: "Scale Length", value: `${specs.scaleLengthInInches}"` },
              { label: "Strings", value: specs.numberOfStrings },
              {
                label: "Bridge Pickup",
                value: formatPickup(specs.pickupConfiguration.bridgePickup),
              },
              {
                label: "Neck Pickup",
                value:
                  specs.pickupConfiguration.neckPickup &&
                  formatPickup(specs.pickupConfiguration.neckPickup),
              },
              {
                label: "Middle Pickup",
                value:
                  specs.pickupConfiguration.middlePickup &&
                  formatPickup(specs.pickupConfiguration.middlePickup),
              },
            ]}
          />
        </Panel>

        <Panel
          title="Current Setup"
          actions={<Button onClick={() => setManualOpen(true)}>Change Strings</Button>}
        >
          <DescriptionList
            items={[
              { label: "Strings", value: setup.stringBrand },
              { label: "Gauge", value: formatGaugeList(setup.stringGauge) },
              { label: "Tuning", value: <TuningBadge tuning={setup.tuning} /> },
              { label: "Last Change", value: setup.lastStringChange },
            ]}
          />
        </Panel>
      </div>

      <StringRecommendationPanel
        guitar={guitar}
        onApply={pendingApply.apply}
      />

      <ChangeStringsDrawer
        open={drawerOpen}
        onOpenChange={handleDrawerOpenChange}
        onSubmit={handleChangeStrings}
        stringCount={specs.numberOfStrings}
        currentTuning={setup.tuning}
        initialValues={
          pendingApply.initialFormValues
            ? {
                ...(pendingApply.initialFormValues as {
                  date: string;
                  stringBrand: string;
                  stringGauge: string;
                }),
                tuning: pendingApply.pending?.tuning,
              }
            : undefined
        }
      />

      <Panel title="String Change History">
        <DataTable
          columns={eventColumns}
          data={stringChangeEvents}
          rowKey={(e) => `${e.date}-${e.stringBrand}`}
          emptyMessage="No string changes recorded."
        />
      </Panel>
    </Page>
  );
}
