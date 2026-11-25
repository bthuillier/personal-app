import { useQuery } from "@tanstack/react-query";
import { albumsQuery, wishlistQuery } from "@/features/music/api";
import { guitarsQuery, amplifiersQuery, pedalsQuery } from "@/features/gear/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { Page } from "@/components/layout/Page";
import { QueryGate } from "@/components/data/QueryGate";
import { StatCard, StatGrid } from "@/components/display/StatCard";

export function HomePage() {
  const guitarsResult = useQuery(guitarsQuery);
  const guitars = guitarsResult.data ?? [];
  const amplifiersResult = useQuery(amplifiersQuery);
  const amplifiers = amplifiersResult.data ?? [];
  const pedalsResult = useQuery(pedalsQuery);
  const pedals = pedalsResult.data ?? [];
  const albumsResult = useQuery(albumsQuery);
  const albums = albumsResult.data ?? [];
  const wishlistResult = useQuery(wishlistQuery);
  const wishlist = wishlistResult.data ?? [];

  const totalGear = guitars.length + amplifiers.length + pedals.length;
  const totalMusic = albums.length + wishlist.length;

  return (
    <Page>
      <PageHeader title="Home" subtitle="Overview of your collection" />
      <QueryGate queries={[guitarsResult, amplifiersResult, pedalsResult, albumsResult, wishlistResult]}>

        <StatGrid columns={2}>
          <StatCard
            to="/gear"
            label="Gear"
            value={totalGear}
            detail={`${guitars.length} guitars · ${amplifiers.length} amps · ${pedals.length} pedals`}
          />
          <StatCard
            to="/music"
            label="Music"
            value={totalMusic}
            detail={`${albums.length} albums · ${wishlist.length} wishlist items`}
          />
        </StatGrid>
      </QueryGate>
    </Page>
  );
}
