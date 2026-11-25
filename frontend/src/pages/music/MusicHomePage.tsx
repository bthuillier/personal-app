import { useQuery } from "@tanstack/react-query";
import type { components } from "@/api/schema";
import { albumsQuery, wishlistQuery } from "@/api/queries";
import { PageHeader } from "@/components/layout/PageHeader";
import { Page } from "@/components/layout/Page";
import { QueryGate } from "@/components/data/QueryGate";
import { Section } from "@/components/layout/Section";
import { StatCard, StatGrid } from "@/components/display/StatCard";
import { BarList } from "@/components/display/BarList";
import { EmptyState } from "@/components/display/EmptyState";
import { ListRow, ListRows } from "@/components/display/ListRow";
import { countBy, formatCounts } from "@/lib/stats";

const TOP_GENRES_LIMIT = 5;

type WishlistAlbum = components["schemas"]["WishlistAlbum"];

export function MusicHomePage() {
  const albumsResult = useQuery(albumsQuery);
  const albums = albumsResult.data ?? [];
  const wishlistResult = useQuery(wishlistQuery);
  const wishlist = wishlistResult.data ?? [];

  const wanted = wishlist.filter((w) => w.status === "Wanted");
  const ordered = wishlist.filter((w) => w.status === "Ordered");

  const formatBreakdown = countBy(albums, (a) => a.format);
  const topGenres = countBy(albums, (a) => a.genre, TOP_GENRES_LIMIT);
  const albumsWithoutGenre = albums.filter(
    (a) => !a.genre || a.genre.length === 0,
  ).length;

  return (
    <Page>
      <PageHeader title="Music" subtitle="Your music collection at a glance" />
      <QueryGate queries={[albumsResult, wishlistResult]}>

        <StatGrid>
          <StatCard
            to="/music/albums"
            label="Albums"
            value={albums.length}
            detail={formatCounts(formatBreakdown)}
          />
          <StatCard
            to="/music/wishlist"
            label="Wishlist"
            value={wishlist.length}
            detail={`${wanted.length} wanted · ${ordered.length} ordered`}
          />
          <StatCard
            label="Uncategorized"
            value={albumsWithoutGenre}
            detail={`${albumsWithoutGenre === 1 ? "album needs" : "albums need"} a genre`}
          />
          <StatCard label="Top genres">
            <div className="mt-3">
              {topGenres.length === 0 ? (
                <EmptyState>No genres assigned yet.</EmptyState>
              ) : (
                <BarList
                  items={topGenres}
                  href={(genre) => `/music/albums?genre=${encodeURIComponent(genre)}`}
                />
              )}
            </div>
          </StatCard>
        </StatGrid>

        <WishlistSection title="On the way" albums={ordered} />
        <WishlistSection title="Wanted" albums={wanted} />
      </QueryGate>
    </Page>
  );
}

function WishlistSection({
  title,
  albums,
}: {
  title: string;
  albums: WishlistAlbum[];
}) {
  if (albums.length === 0) return null;
  return (
    <Section title={title}>
      <ListRows>
        {albums.map((album) => (
          <ListRow key={album.id}>
            <span className="font-medium">{album.name}</span>{" "}
            <span className="text-muted-foreground">by {album.artist}</span>
          </ListRow>
        ))}
      </ListRows>
    </Section>
  );
}
