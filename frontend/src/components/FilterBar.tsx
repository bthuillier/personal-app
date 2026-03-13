import { useState, useMemo, useRef, useEffect, type ReactNode } from "react";
import { formatEnum } from "@/lib/utils";
import { SearchInput } from "@/components/SearchInput";
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
  options: string[];
}

interface DynamicFilterOption<T> {
  name: string;
  label: string;
  extract: (row: T) => string;
}

export type FilterOption<T> = StaticFilterOption | DynamicFilterOption<T>;

interface FilterBarProps<T> {
  data: T[];
  searchPlaceholder?: string;
  searchFields: (keyof T & string)[];
  filters?: FilterOption<T>[];
  children: (filtered: T[]) => ReactNode;
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
  filters = [],
  children,
}: FilterBarProps<T>) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>(
    () => Object.fromEntries(filters.map((f) => [f.name, allValue(f)])),
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

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
    const map: Record<string, string[]> = {};
    for (const filter of filters) {
      if (isStatic(filter)) {
        map[filter.name] = filter.options;
      } else {
        const values = [...new Set(data.map(filter.extract))].sort();
        map[filter.name] = values;
      }
    }
    return map;
  }, [data, filters]);

  const filtered = useMemo(() => {
    const query = debouncedSearch.toLowerCase().trim();

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
          const rowValue = isStatic(filter)
            ? String(row[filter.name as keyof T])
            : filter.extract(row);
          if (rowValue !== selected) return false;
        }
      }

      return true;
    });
  }, [data, debouncedSearch, searchFields, activeFilters, filters]);

  function updateFilter(name: string, value: string) {
    setActiveFilters((prev) => ({ ...prev, [name]: value }));
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
              <SelectTrigger className={isAll ? "text-muted-foreground" : ""}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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
