import { useMemo } from "react";
import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteInput,
  AutocompleteItem,
} from "@/components/ui/autocomplete";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  className?: string;
  maxSuggestions?: number;
}

/**
 * Free-text search with suggestions once the user starts typing. Picking a
 * suggestion fills the input; keyboard and ARIA come from Base UI.
 */
export function SearchInput({
  value,
  onChange,
  suggestions,
  placeholder = "Search...",
  className,
  maxSuggestions = 8,
}: SearchInputProps) {
  // Nothing is suggested on an empty query, so the popup stays closed until
  // the user types.
  const matches = useMemo(() => {
    const query = value.toLowerCase().trim();
    if (!query) return [];
    return suggestions.filter((s) => s.toLowerCase().includes(query));
  }, [value, suggestions]);

  return (
    <Autocomplete
      items={matches}
      filter={null}
      limit={maxSuggestions}
      value={value}
      onValueChange={(next) => onChange(next)}
    >
      <AutocompleteInput placeholder={placeholder} className={cn(className)} />
      <AutocompleteContent>
        {(item: string) => (
          <AutocompleteItem key={item} value={item}>
            {item}
          </AutocompleteItem>
        )}
      </AutocompleteContent>
    </Autocomplete>
  );
}
