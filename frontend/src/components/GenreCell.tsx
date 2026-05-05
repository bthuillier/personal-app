import {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { useAddAlbumGenre, useRemoveAlbumGenre } from "@/api/mutations";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface GenreCellProps {
  albumId: string;
  genres: string[] | undefined;
  knownGenres: string[];
}

const MAX_SUGGESTIONS = 8;

export function GenreCell({ albumId, genres, knownGenres }: GenreCellProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [dropUp, setDropUp] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addMutation = useAddAlbumGenre(albumId);
  const removeMutation = useRemoveAlbumGenre(albumId);

  const current = useMemo(() => genres ?? [], [genres]);

  const closeEditor = useCallback(() => {
    setEditing(false);
    setValue("");
    setHighlightIndex(-1);
  }, []);

  const suggestions = useMemo(() => {
    const query = value.toLowerCase().trim();
    if (!query) return [];
    const pool = knownGenres.filter((g) => !current.includes(g));
    return pool
      .filter((g) => g.toLowerCase().includes(query))
      .slice(0, MAX_SUGGESTIONS);
  }, [value, knownGenres, current]);

  const measureList = useCallback((list: HTMLUListElement | null) => {
    if (!list) return;
    const input = inputRef.current;
    if (!input) return;
    const inputRect = input.getBoundingClientRect();
    const listHeight = list.offsetHeight;
    const spaceBelow = window.innerHeight - inputRect.bottom;
    const spaceAbove = inputRect.top;
    setDropUp(spaceBelow < listHeight + 8 && spaceAbove > spaceBelow);
  }, []);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    if (!editing) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        closeEditor();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [editing, closeEditor]);

  function submit(raw: string) {
    const genre = raw.trim();
    if (!genre) return;
    if (current.includes(genre)) {
      closeEditor();
      return;
    }
    addMutation.mutate(genre);
    closeEditor();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" && suggestions.length > 0) {
      e.preventDefault();
      setHighlightIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp" && suggestions.length > 0) {
      e.preventDefault();
      setHighlightIndex((i) =>
        i <= 0 ? suggestions.length - 1 : i - 1,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const picked =
        highlightIndex >= 0 ? suggestions[highlightIndex] : value;
      submit(picked);
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeEditor();
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative flex flex-wrap items-center gap-1"
      onClick={(e) => e.stopPropagation()}
    >
      {current.map((g) => (
        <Badge key={g} variant="secondary" className="group/genre gap-1 pr-1">
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
        <div className="relative">
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setHighlightIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Add genre..."
            className="h-6 w-32 px-2 py-0 text-xs"
          />
          {suggestions.length > 0 && (
            <ul
              ref={measureList}
              className={cn(
                "absolute left-0 z-50 w-40 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-md",
                dropUp ? "bottom-full mb-1" : "top-full mt-1",
              )}
            >
              {suggestions.map((s, i) => (
                <li
                  key={s}
                  className={cn(
                    "cursor-pointer px-2 py-1 text-xs",
                    i === highlightIndex
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-muted",
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    submit(s);
                  }}
                >
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>
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
