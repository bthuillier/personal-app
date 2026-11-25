import { useQuery } from "@tanstack/react-query";
import {
  guitarsQuery,
  amplifiersQuery,
  pedalsQuery,
  albumsQuery,
  wishlistQuery,
} from "@/api/queries";
import { PageHeader } from "@/components/layout/PageHeader";
import { Page } from "@/components/layout/Page";
import { StatCard, StatGrid } from "@/components/display/StatCard";

export function HomePage() {
  const { data: guitars = [] } = useQuery(guitarsQuery);
  const { data: amplifiers = [] } = useQuery(amplifiersQuery);
  const { data: pedals = [] } = useQuery(pedalsQuery);
  const { data: albums = [] } = useQuery(albumsQuery);
  const { data: wishlist = [] } = useQuery(wishlistQuery);

  const totalGear = guitars.length + amplifiers.length + pedals.length;
  const totalMusic = albums.length + wishlist.length;

  return (
    <Page>
      <PageHeader title="Home" subtitle="Overview of your collection" />

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
    </Page>
  );
}
