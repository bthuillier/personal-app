import { useMemo, useState } from "react";
import { useAddAlbumGenre, useRemoveAlbumGenre } from "@/features/music/api";
import { Badge } from "@/components/ui/badge";
import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteInput,
  AutocompleteItem,
} from "@/components/ui/autocomplete";

interface GenreCellProps {
  albumId: string;
  genres: string[] | undefined;
  knownGenres: string[];
}

const MAX_SUGGESTIONS = 8;

/**
 * An album's genres as removable badges, plus a "+" that opens an input to
 * add one: pick a known genre from the suggestions, or type a new one and
 * press Enter.
 */
export function GenreCell({ albumId, genres, knownGenres }: GenreCellProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [highlighted, setHighlighted] = useState<string | undefined>();
  const [popupOpen, setPopupOpen] = useState(false);

  const addMutation = useAddAlbumGenre(albumId);
  const removeMutation = useRemoveAlbumGenre(albumId);

  const current = useMemo(() => genres ?? [], [genres]);

  const matches = useMemo(() => {
    const query = value.toLowerCase().trim();
    if (!query) return [];
    return knownGenres.filter(
      (g) => !current.includes(g) && g.toLowerCase().includes(query),
    );
  }, [value, knownGenres, current]);

  function close() {
    setEditing(false);
    setValue("");
    setHighlighted(undefined);
  }

  function add(raw: string) {
    const genre = raw.trim();
    if (genre && !current.includes(genre)) addMutation.mutate(genre);
    close();
  }

  return (
    // The cell sits in a clickable table row: keep clicks (including on the
    // portaled suggestions, which bubble through React) from opening the album.
    <div
      className="flex flex-wrap items-center gap-1"
      onClick={(e) => e.stopPropagation()}
    >
      {current.map((g) => (
        <Badge key={g} variant="secondary" className="gap-1 pr-1">
          <span>{g}</span>
          <button
            type="button"
            aria-label={`Remove ${g}`}
            className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-sm text-muted-foreground opacity-60 hover:bg-muted-foreground/20 hover:opacity-100"
            onClick={() => removeMutation.mutate(g)}
          >
            ×
          </button>
        </Badge>
      ))}
      {editing ? (
        <Autocomplete
          items={matches}
          filter={null}
          limit={MAX_SUGGESTIONS}
          value={value}
          onValueChange={(next, details) => {
            if (details.reason === "item-press") add(next);
            else setValue(next);
          }}
          onItemHighlighted={setHighlighted}
          onOpenChange={setPopupOpen}
        >
          <AutocompleteInput
            autoFocus
            aria-label="Add genre"
            placeholder="Add genre..."
            className="h-6 w-32 px-2 py-0 text-xs md:text-xs"
            onKeyDown={(e) => {
              // With a suggestion highlighted, Base UI picks it (item-press).
              if (e.key === "Enter" && highlighted === undefined) {
                e.preventDefault();
                add(value);
              } else if (e.key === "Escape" && !popupOpen) {
                close();
              }
            }}
            onBlur={close}
          />
          <AutocompleteContent className="w-40">
            {(genre: string) => (
              <AutocompleteItem key={genre} value={genre} className="text-xs">
                {genre}
              </AutocompleteItem>
            )}
          </AutocompleteContent>
        </Autocomplete>
      ) : (
        <button
          type="button"
          aria-label="Add genre"
          className="inline-flex h-5 w-5 items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground hover:border-foreground hover:text-foreground"
          onClick={() => setEditing(true)}
        >
          +
        </button>
      )}
    </div>
  );
}
