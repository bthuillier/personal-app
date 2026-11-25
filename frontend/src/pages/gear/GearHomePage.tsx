import { useQuery } from "@tanstack/react-query";
import { guitarsQuery, amplifiersQuery, pedalsQuery } from "@/api/queries";
import { Page } from "@/components/layout/Page";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard, StatGrid } from "@/components/display/StatCard";
import { BarList } from "@/components/display/BarList";
import { EmptyState } from "@/components/display/EmptyState";
import { countBy, formatCounts } from "@/lib/stats";
import { formatEnum } from "@/lib/utils";

const TOP_LIMIT = 5;

export function GearHomePage() {
  const { data: guitars = [] } = useQuery(guitarsQuery);
  const { data: amplifiers = [] } = useQuery(amplifiersQuery);
  const { data: pedals = [] } = useQuery(pedalsQuery);

  const guitarsByStrings = countBy(
    guitars,
    (g) => `${g.specifications.numberOfStrings}-string`,
  );
  const ampsByType = countBy(amplifiers, (a) => a.type);
  const guitarsByBrand = countBy(guitars, (g) => g.brand, TOP_LIMIT);
  const pedalsByType = countBy(pedals, (p) => p.type, TOP_LIMIT);
  const pedalTypeCount = new Set(pedals.map((p) => p.type)).size;

  return (
    <Page>
      <PageHeader title="Gear" subtitle="Your gear collection at a glance" />

      <StatGrid columns={3}>
        <StatCard
          to="/gear/guitars"
          label="Guitars"
          value={guitars.length}
          detail={formatCounts(guitarsByStrings)}
        />
        <StatCard
          to="/gear/amplifiers"
          label="Amplifiers"
          value={amplifiers.length}
          detail={formatCounts(ampsByType, formatEnum)}
        />
        <StatCard
          to="/gear/pedals"
          label="Pedals"
          value={pedals.length}
          detail={`${pedalTypeCount} ${pedalTypeCount === 1 ? "type" : "types"}`}
        />
      </StatGrid>

      <StatGrid columns={2}>
        <StatCard label="Guitars by brand">
          <div className="mt-3">
            {guitarsByBrand.length === 0 ? (
              <EmptyState>No guitars yet.</EmptyState>
            ) : (
              <BarList
                items={guitarsByBrand}
                href={(brand) => `/gear/guitars?brand=${encodeURIComponent(brand)}`}
                formatLabel={formatEnum}
              />
            )}
          </div>
        </StatCard>
        <StatCard label="Pedals by type">
          <div className="mt-3">
            {pedalsByType.length === 0 ? (
              <EmptyState>No pedals yet.</EmptyState>
            ) : (
              <BarList
                items={pedalsByType}
                href={(type) => `/gear/pedals?type=${encodeURIComponent(type)}`}
                formatLabel={formatEnum}
              />
            )}
          </div>
        </StatCard>
      </StatGrid>
    </Page>
  );
}
