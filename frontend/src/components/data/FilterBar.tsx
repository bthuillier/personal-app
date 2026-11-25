import { useState, useMemo, useEffect, type ReactNode } from "react";
import { useSearchParams } from "react-router";
import { cn, formatEnum } from "@/lib/utils";
import { SearchInput } from "@/components/data/SearchInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StaticFilterOption {
  name: string;
  label: string;
  options: readonly string[];
}

interface DynamicFilterOption<T> {
  name: string;
  label: string;
  extract: (row: T) => string | string[];
}

export type FilterOption<T> = StaticFilterOption | DynamicFilterOption<T>;

interface FilterBarProps<T> {
  data: T[];
  searchPlaceholder?: string;
  searchFields: (keyof T & string)[];
  filters?: FilterOption<T>[];
  children: (filtered: T[]) => ReactNode;
}

const SEARCH_PARAM = "q";
const NO_FILTERS: never[] = [];

/** Copy of `params` with `name` set, or removed when `value` is empty. */
function withParam(params: URLSearchParams, name: string, value: string) {
  const next = new URLSearchParams(params);
  if (value) next.set(name, value);
  else next.delete(name);
  return next;
}

function allValue(filter: { label: string }) {
  return `All ${filter.label}s`;
}

function isStatic<T>(f: FilterOption<T>): f is StaticFilterOption {
  return "options" in f;
}

export function FilterBar<T>({
  data,
  searchPlaceholder = "Search...",
  searchFields,
  filters = NO_FILTERS,
  children,
}: FilterBarProps<T>) {
  // The URL is the single source of truth for search and filters, so links,
  // reloads and re-clicking a nav entry (which clears the query) all agree
  // with what is displayed.
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get(SEARCH_PARAM) ?? "";
  const activeFilters = useMemo<Record<string, string>>(
    () =>
      Object.fromEntries(
        filters.map((f) => [f.name, searchParams.get(f.name) ?? allValue(f)]),
      ),
    [filters, searchParams],
  );

  // The input keeps its own state so typing stays instant; it is written to
  // the URL once typing pauses, and reset when the URL changes elsewhere.
  const [search, setSearch] = useState(urlSearch);
  const [prevUrlSearch, setPrevUrlSearch] = useState(urlSearch);
  if (urlSearch !== prevUrlSearch) {
    setPrevUrlSearch(urlSearch);
    if (urlSearch !== search) setSearch(urlSearch);
  }

  useEffect(() => {
    if (search === urlSearch) return;
    const timeout = setTimeout(
      () => setSearchParams((prev) => withParam(prev, SEARCH_PARAM, search), { replace: true }),
      200,
    );
    return () => clearTimeout(timeout);
  }, [search, urlSearch, setSearchParams]);

  const suggestions = useMemo(() => {
    const values = new Set<string>();
    for (const row of data) {
      for (const field of searchFields) {
        const val = row[field];
        if (typeof val === "string" && val) values.add(val);
      }
    }
    return [...values].sort();
  }, [data, searchFields]);

  const resolvedOptions = useMemo(() => {
    const map: Record<string, readonly string[]> = {};
    for (const filter of filters) {
      if (isStatic(filter)) {
        map[filter.name] = filter.options;
      } else {
        const values = new Set<string>();
        for (const row of data) {
          const extracted = filter.extract(row);
          if (Array.isArray(extracted)) {
            for (const v of extracted) values.add(v);
          } else {
            values.add(extracted);
          }
        }
        map[filter.name] = [...values].sort();
      }
    }
    return map;
  }, [data, filters]);

  const filtered = useMemo(() => {
    const query = urlSearch.toLowerCase().trim();

    return data.filter((row) => {
      if (query) {
        const matches = searchFields.some((field) => {
          const val = row[field];
          return typeof val === "string" && val.toLowerCase().includes(query);
        });
        if (!matches) return false;
      }

      for (const filter of filters) {
        const selected = activeFilters[filter.name];
        if (selected && selected !== allValue(filter)) {
          if (isStatic(filter)) {
            if (String(row[filter.name as keyof T]) !== selected) return false;
          } else {
            const extracted = filter.extract(row);
            const matched = Array.isArray(extracted)
              ? extracted.includes(selected)
              : extracted === selected;
            if (!matched) return false;
          }
        }
      }

      return true;
    });
  }, [data, urlSearch, searchFields, activeFilters, filters]);

  function updateFilter(name: string, value: string) {
    const filter = filters.find((f) => f.name === name);
    const param = filter && value === allValue(filter) ? "" : value;
    // replace: tweaking filters shouldn't fill the history.
    setSearchParams((prev) => withParam(prev, name, param), { replace: true });
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          placeholder={searchPlaceholder}
          value={search}
          onChange={setSearch}
          suggestions={suggestions}
          className="w-64"
        />
        {filters.map((filter) => {
          const isAll = activeFilters[filter.name] === allValue(filter);
          return (
            <Select
              key={filter.name}
              value={activeFilters[filter.name]}
              onValueChange={(val) => {
                if (val != null) updateFilter(filter.name, val);
              }}
            >
              <SelectTrigger
                className={cn("min-w-40", isAll && "text-muted-foreground")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start" alignItemWithTrigger={false}>
                <SelectItem value={allValue(filter)}>{allValue(filter)}</SelectItem>
                {(resolvedOptions[filter.name] ?? []).map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {formatEnum(opt)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        })}
      </div>
      {children(filtered)}
    </>
  );
}
