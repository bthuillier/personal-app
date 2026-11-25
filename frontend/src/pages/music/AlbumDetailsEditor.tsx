import { useState } from "react";
import type { components } from "@/api/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AlbumDetails = components["schemas"]["AlbumDetails"];
type AlbumFormat = AlbumDetails["format"];

const FORMATS: AlbumFormat[] = ["Vinyl", "CD"];

interface AlbumDetailsEditorProps {
  initial: AlbumDetails;
  onSave: (details: AlbumDetails) => Promise<void>;
  onCancel: () => void;
}

export function AlbumDetailsEditor({
  initial,
  onSave,
  onCancel,
}: AlbumDetailsEditorProps) {
  const [format, setFormat] = useState<AlbumFormat>(initial.format);
  const [releaseDate, setReleaseDate] = useState(initial.releaseDate);
  const [submitting, setSubmitting] = useState(false);

  const unchanged =
    format === initial.format && releaseDate === initial.releaseDate;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSave({ format, releaseDate });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-muted/30 p-4"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="album-format">Format</Label>
        <Select
          value={format}
          onValueChange={(val) => {
            if (val != null) setFormat(val as AlbumFormat);
          }}
        >
          <SelectTrigger id="album-format">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FORMATS.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="album-release-date">Release Date</Label>
        <Input
          id="album-release-date"
          type="date"
          required
          value={releaseDate}
          onChange={(e) => setReleaseDate(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={submitting || unchanged}>
          Save
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
