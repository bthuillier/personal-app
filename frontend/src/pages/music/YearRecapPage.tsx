import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type { components } from "@/api/schema";
import { albumsQuery } from "@/api/queries";
import { PageHeader } from "@/components/layout/PageHeader";
import { Page } from "@/components/layout/Page";
import { Section } from "@/components/layout/Section";
import { StatCard, StatGrid } from "@/components/display/StatCard";
import { StarRating } from "@/components/display/StarRating";
import { BarList } from "@/components/display/BarList";
import { EmptyState } from "@/components/display/EmptyState";
import { QueryGate } from "@/components/data/QueryGate";
import { ListRow, ListRows } from "@/components/display/ListRow";
import { countBy, formatCounts } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PartialAlbum = components["schemas"]["PartialAlbum"];
type ReviewedAlbum = PartialAlbum & {
  review: NonNullable<PartialAlbum["review"]>;
};

const TOP_LIMIT = 10;
const TOP_GENRES_LIMIT = 5;

const releaseYear = (album: PartialAlbum) => album.releaseDate.slice(0, 4);

const isReviewed = (album: PartialAlbum): album is ReviewedAlbum =>
  album.review != null;

/** Competition ranking: equal ratings share a rank (1, 2, 2, 4…). */
function rankByRating(albums: ReviewedAlbum[]) {
  const sorted = [...albums].sort(
    (a, b) =>
      b.review.rating - a.review.rating ||
      a.name.localeCompare(b.name) ||
      a.artist.localeCompare(b.artist),
  );
  return sorted.map((album, i) => {
    let rank = i + 1;
    for (let j = i - 1; j >= 0; j--) {
      if (sorted[j].review.rating !== album.review.rating) break;
      rank = j + 1;
    }
    return { album, rank };
  });
}

export function YearRecapPage() {
  const albumsResult = useQuery(albumsQuery);
  const { data: albums = [] } = albumsResult;
  const [searchParams, setSearchParams] = useSearchParams();

  const years = useMemo(
    () => [...new Set(albums.map(releaseYear))].sort((a, b) => b.localeCompare(a)),
    [albums],
  );

  const currentYear = String(new Date().getFullYear());
  const defaultYear =
    years.find((y) => y <= currentYear) ?? years[0] ?? currentYear;
  const year = searchParams.get("year") ?? defaultYear;

  const yearAlbums = useMemo(
    () => albums.filter((a) => releaseYear(a) === year),
    [albums, year],
  );

  const reviewed = yearAlbums.filter(isReviewed);
  const unreviewed = yearAlbums
    .filter((a) => !isReviewed(a))
    .sort((a, b) => a.name.localeCompare(b.name));

  const top = rankByRating(reviewed).slice(0, TOP_LIMIT);

  const averageRating =
    reviewed.length > 0
      ? reviewed.reduce((sum, a) => sum + a.review.rating, 0) / reviewed.length
      : null;

  const formatBreakdown = countBy(yearAlbums, (a) => a.format);
  const topGenres = countBy(yearAlbums, (a) => a.genre, TOP_GENRES_LIMIT);

  const yearIndex = years.indexOf(year);
  const newerYear = yearIndex > 0 ? years[yearIndex - 1] : undefined;
  const olderYear =
    yearIndex >= 0 && yearIndex < years.length - 1
      ? years[yearIndex + 1]
      : undefined;

  const selectYear = (y: string) => setSearchParams({ year: y });

  if (!albumsResult.isSuccess) return <QueryGate queries={[albumsResult]} />;

  return (
    <Page>
      <PageHeader
        title={`Recap ${year}`}
        subtitle={`Albums released in ${year}, ranked by your reviews`}
        actions={
          <div className="flex items-center gap-1">
            <YearStepButton label="Older year" target={olderYear} onSelect={selectYear}>
              <ChevronLeftIcon size={16} />
            </YearStepButton>
            <Select
              value={year}
              onValueChange={(y) => {
                if (y != null) selectYear(y);
              }}
            >
              <SelectTrigger aria-label="Year" className="tabular-nums">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {!years.includes(year) && <SelectItem value={year}>{year}</SelectItem>}
                {years.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <YearStepButton label="Newer year" target={newerYear} onSelect={selectYear}>
              <ChevronRightIcon size={16} />
            </YearStepButton>
          </div>
        }
      />

      {yearAlbums.length === 0 ? (
        <EmptyState>No albums released in {year} in your collection.</EmptyState>
      ) : (
        <>
          <StatGrid>
            <StatCard
              label="Albums"
              value={yearAlbums.length}
              detail={formatCounts(formatBreakdown)}
            />
            <StatCard
              label="Reviewed"
              value={
                <>
                  {reviewed.length}
                  <span className="text-lg font-normal text-muted-foreground">
                    {" "}
                    / {yearAlbums.length}
                  </span>
                </>
              }
              detail={
                unreviewed.length === 0
                  ? "All reviewed"
                  : `${unreviewed.length} left to review`
              }
            />
            <StatCard
              label="Average rating"
              value={
                averageRating === null ? undefined : (
                  <>
                    {(averageRating / 2).toFixed(2)}
                    <span className="text-lg font-normal text-muted-foreground">
                      {" "}
                      / 5
                    </span>
                  </>
                )
              }
            >
              <div className="mt-1">
                {averageRating === null ? (
                  <EmptyState>No reviews yet.</EmptyState>
                ) : (
                  <StarRating
                    value={Math.round(averageRating)}
                    readOnly
                    showLabel={false}
                    size={14}
                  />
                )}
              </div>
            </StatCard>
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

          <Section title={`Top ${TOP_LIMIT} of ${year}`}>
            {top.length === 0 ? (
              <EmptyState>
                Review some albums from {year} to build your top {TOP_LIMIT}.
              </EmptyState>
            ) : (
              <ol className="flex flex-col gap-2">
                {top.map(({ album, rank }) => (
                  <li key={album.id}>
                    <ListRow
                      to={`/music/albums/${album.id}`}
                      className="flex items-center gap-4 text-base"
                    >
                      <span
                        className={cn(
                          "w-8 shrink-0 text-right text-xl font-bold tabular-nums",
                          rank <= 3 ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {rank}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{album.name}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {album.artist} · {album.format}
                          {album.genre && album.genre.length > 0 &&
                            ` · ${album.genre.join(", ")}`}
                        </p>
                      </div>
                      <div className="shrink-0">
                        <StarRating value={album.review.rating} readOnly size={16} />
                      </div>
                    </ListRow>
                  </li>
                ))}
              </ol>
            )}
          </Section>

          {unreviewed.length > 0 && (
            <Section title="Not reviewed yet">
              <ListRows>
                {unreviewed.map((album) => (
                  <ListRow key={album.id} to={`/music/albums/${album.id}`}>
                    <span className="font-medium">{album.name}</span>{" "}
                    <span className="text-muted-foreground">by {album.artist}</span>
                  </ListRow>
                ))}
              </ListRows>
            </Section>
          )}
        </>
      )}
    </Page>
  );
}

function YearStepButton({
  label,
  target,
  onSelect,
  children,
}: {
  label: string;
  target: string | undefined;
  onSelect: (year: string) => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={label}
      disabled={!target}
      onClick={() => target && onSelect(target)}
    >
      {children}
    </Button>
  );
}
