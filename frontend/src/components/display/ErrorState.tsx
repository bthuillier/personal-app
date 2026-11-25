import { TriangleAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ErrorStateProps {
  title?: string;
  /** The underlying error; its message is shown under the title. */
  error?: unknown;
  onRetry?: () => void;
}

/** Framed error with an optional retry, e.g. when the API is unreachable. */
export function ErrorState({
  title = "Couldn't load this page",
  error,
  onRetry,
}: ErrorStateProps) {
  const message = error instanceof Error ? error.message : undefined;
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-5"
    >
      <div className="flex items-center gap-2 font-medium text-destructive">
        <TriangleAlertIcon size={16} />
        {title}
      </div>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
