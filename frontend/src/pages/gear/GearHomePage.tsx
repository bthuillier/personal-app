import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { guitarsQuery, amplifiersQuery, pedalsQuery } from "@/api/queries";
import { formatEnum } from "@/lib/utils";

export function GearHomePage() {
  const { data: guitars = [] } = useQuery(guitarsQuery);
  const { data: amplifiers = [] } = useQuery(amplifiersQuery);
  const { data: pedals = [] } = useQuery(pedalsQuery);

  const brandCounts = guitars.reduce(
    (acc, g) => {
      acc[g.brand] = (acc[g.brand] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const pedalTypeCounts = pedals.reduce(
    (acc, p) => {
      acc[p.type] = (acc[p.type] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">Gear</h1>
        <p className="text-muted-foreground">Your gear collection at a glance</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Link
          to="/gear/guitars"
          className="rounded-lg border border-border p-5 transition-colors hover:bg-muted/50"
        >
          <p className="text-sm text-muted-foreground">Guitars</p>
          <p className="mt-1 text-3xl font-bold">{guitars.length}</p>
        </Link>
        <Link
          to="/gear/amplifiers"
          className="rounded-lg border border-border p-5 transition-colors hover:bg-muted/50"
        >
          <p className="text-sm text-muted-foreground">Amplifiers</p>
          <p className="mt-1 text-3xl font-bold">{amplifiers.length}</p>
        </Link>
        <Link
          to="/gear/pedals"
          className="rounded-lg border border-border p-5 transition-colors hover:bg-muted/50"
        >
          <p className="text-sm text-muted-foreground">Pedals</p>
          <p className="mt-1 text-3xl font-bold">{pedals.length}</p>
        </Link>
      </div>

      {Object.keys(brandCounts).length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Guitars by brand</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(brandCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([brand, count]) => (
                <div
                  key={brand}
                  className="rounded-md border border-border px-3 py-2 text-sm"
                >
                  <span className="font-medium">{formatEnum(brand)}</span>{" "}
                  <span className="text-muted-foreground">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {Object.keys(pedalTypeCounts).length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Pedals by type</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(pedalTypeCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => (
                <div
                  key={type}
                  className="rounded-md border border-border px-3 py-2 text-sm"
                >
                  <span className="font-medium">{formatEnum(type)}</span>{" "}
                  <span className="text-muted-foreground">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
