import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { components } from "@/api/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StarRating } from "@/components/StarRating";
import { cn } from "@/lib/utils";

type Review = components["schemas"]["Review"];

interface ReviewEditorProps {
  initial?: Review;
  onSave: (review: Review) => Promise<void> | void;
  onCancel: () => void;
}

type Tab = "write" | "preview";

export function ReviewEditor({ initial, onSave, onCancel }: ReviewEditorProps) {
  const [title, setTitle] = useState<string>(initial?.title ?? "");
  const [rating, setRating] = useState<number>(initial?.rating ?? 0);
  const [description, setDescription] = useState<string>(
    initial?.description ?? "",
  );
  const [tab, setTab] = useState<Tab>("write");
  const [submitting, setSubmitting] = useState(false);

  async function handleSave() {
    setSubmitting(true);
    try {
      await onSave({ title, rating, description });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Title
        </label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give your review a title..."
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Rating
        </label>
        <StarRating value={rating} onChange={setRating} size={24} />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1 border-b border-border">
          <TabButton active={tab === "write"} onClick={() => setTab("write")}>
            Write
          </TabButton>
          <TabButton
            active={tab === "preview"}
            onClick={() => setTab("preview")}
          >
            Preview
          </TabButton>
        </div>

        {tab === "write" ? (
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Write your review in markdown..."
            rows={10}
            className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm font-mono shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        ) : (
          <div className="min-h-[12rem] rounded-md border border-input bg-background px-3 py-2 text-sm">
            {description.trim() ? (
              <MarkdownView source={description} />
            ) : (
              <p className="text-muted-foreground">Nothing to preview.</p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={submitting}>
          {submitting ? "Saving..." : "Save Review"}
        </Button>
      </div>
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "-mb-px border-b-2 px-3 py-1.5 text-sm transition-colors",
        active
          ? "border-foreground text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function MarkdownView({ source }: { source: string }) {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{source}</ReactMarkdown>
    </div>
  );
}
