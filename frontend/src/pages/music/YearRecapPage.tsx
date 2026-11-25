import { useMemo } from "react";
import { Link, useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type { components } from "@/api/schema";
import { albumsQuery } from "@/api/queries";
import { StarRating } from "@/components/StarRating";
import { cn } from "@/lib/utils";

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
  const { data: albums = [], isLoading } = useQuery(albumsQuery);
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

  const formatCounts = yearAlbums.reduce(
    (acc, a) => {
      acc[a.format] = (acc[a.format] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const genreCounts = new Map<string, number>();
  for (const album of yearAlbums) {
    for (const g of album.genre ?? []) {
      genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1);
    }
  }
  const topGenres = [...genreCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, TOP_GENRES_LIMIT);

  const yearIndex = years.indexOf(year);
  const newerYear = yearIndex > 0 ? years[yearIndex - 1] : undefined;
  const olderYear =
    yearIndex >= 0 && yearIndex < years.length - 1
      ? years[yearIndex + 1]
      : undefined;

  const selectYear = (y: string) => setSearchParams({ year: y });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Recap {year}</h1>
          <p className="text-muted-foreground">
            Albums released in {year}, ranked by your reviews
          </p>
        </div>
        <div className="flex items-center gap-1">
          <YearStepButton
            label="Older year"
            target={olderYear}
            onSelect={selectYear}
          >
            <ChevronLeftIcon size={16} />
          </YearStepButton>
          <select
            value={year}
            onChange={(e) => selectYear(e.target.value)}
            className="h-8 rounded-md border border-border bg-background px-2 text-sm tabular-nums"
            aria-label="Year"
          >
            {!years.includes(year) && <option value={year}>{year}</option>}
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <YearStepButton
            label="Newer year"
            target={newerYear}
            onSelect={selectYear}
          >
            <ChevronRightIcon size={16} />
          </YearStepButton>
        </div>
      </div>

      {yearAlbums.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No albums released in {year} in your collection.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Albums">
              <p className="mt-1 text-3xl font-bold">{yearAlbums.length}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {Object.entries(formatCounts)
                  .map(([format, count]) => `${count} ${format}`)
                  .join(" · ")}
              </p>
            </StatCard>
            <StatCard label="Reviewed">
              <p className="mt-1 text-3xl font-bold">
                {reviewed.length}
                <span className="text-lg font-normal text-muted-foreground">
                  {" "}
                  / {yearAlbums.length}
                </span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {unreviewed.length === 0
                  ? "All reviewed"
                  : `${unreviewed.length} left to review`}
              </p>
            </StatCard>
            <StatCard label="Average rating">
              {averageRating === null ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  No reviews yet.
                </p>
              ) : (
                <>
                  <p className="mt-1 text-3xl font-bold tabular-nums">
                    {(averageRating / 2).toFixed(2)}
                    <span className="text-lg font-normal text-muted-foreground">
                      {" "}
                      / 5
                    </span>
                  </p>
                  <div className="mt-1">
                    <StarRating
                      value={Math.round(averageRating)}
                      readOnly
                      showLabel={false}
                      size={14}
                    />
                  </div>
                </>
              )}
            </StatCard>
            <StatCard label="Top genres">
              {topGenres.length === 0 ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  No genres assigned.
                </p>
              ) : (
                <ul className="mt-2 flex flex-col gap-1 text-sm">
                  {topGenres.map(([name, count]) => (
                    <li key={name} className="flex justify-between gap-2">
                      <span className="truncate">{name}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {count}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </StatCard>
          </div>

          <section>
            <h2 className="mb-3 text-lg font-semibold">
              Top {TOP_LIMIT} of {year}
            </h2>
            {top.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Review some albums from {year} to build your top {TOP_LIMIT}.
              </p>
            ) : (
              <ol className="flex flex-col gap-2">
                {top.map(({ album, rank }) => (
                  <li key={album.id}>
                    <Link
                      to={`/music/albums/${album.id}`}
                      className="flex items-center gap-4 rounded-md border border-border px-4 py-3 transition-colors hover:bg-muted/50"
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
                        <StarRating
                          value={album.review.rating}
                          readOnly
                          size={16}
                        />
                      </div>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {unreviewed.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-semibold">Not reviewed yet</h2>
              <div className="flex flex-col gap-2">
                {unreviewed.map((album) => (
                  <Link
                    key={album.id}
                    to={`/music/albums/${album.id}`}
                    className="rounded-md border border-border px-4 py-3 text-sm transition-colors hover:bg-muted/50"
                  >
                    <span className="font-medium">{album.name}</span>{" "}
                    <span className="text-muted-foreground">
                      by {album.artist}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      {children}
    </div>
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
    <button
      type="button"
      aria-label={label}
      disabled={!target}
      onClick={() => target && onSelect(target)}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40 disabled:hover:text-muted-foreground"
    >
      {children}
    </button>
  );
}
