import { useState } from "react";
import { StarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (next: number) => void;
  readOnly?: boolean;
  size?: number;
}

const STAR_COUNT = 5;
const MAX_HALF_STARS = STAR_COUNT * 2;

function halfStarFromMouseEvent(
  e: React.MouseEvent<HTMLButtonElement>,
  starIndex: number,
): number {
  const rect = e.currentTarget.getBoundingClientRect();
  const isLeftHalf = e.clientX - rect.left < rect.width / 2;
  return starIndex * 2 + (isLeftHalf ? 1 : 2);
}

export function StarRating({
  value,
  onChange,
  readOnly = false,
  size = 20,
}: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null);
  const displayed = hover ?? value;

  return (
    <div
      className="inline-flex items-center gap-0.5"
      onMouseLeave={() => setHover(null)}
    >
      {Array.from({ length: STAR_COUNT }, (_, i) => {
        const fillHalves = Math.max(0, Math.min(2, displayed - i * 2));
        return (
          <StarSlot
            key={i}
            fillHalves={fillHalves}
            size={size}
            readOnly={readOnly}
            onHover={(half) =>
              !readOnly && setHover(Math.min(MAX_HALF_STARS, i * 2 + half))
            }
            onClick={(e) => {
              if (readOnly || !onChange) return;
              onChange(halfStarFromMouseEvent(e, i));
            }}
          />
        );
      })}
      <span className="ml-2 text-sm tabular-nums text-muted-foreground">
        {(displayed / 2).toFixed(1)} / {STAR_COUNT}
      </span>
    </div>
  );
}

interface StarSlotProps {
  fillHalves: number;
  size: number;
  readOnly: boolean;
  onHover: (half: 1 | 2) => void;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

function StarSlot({ fillHalves, size, readOnly, onHover, onClick }: StarSlotProps) {
  const filledClass = "fill-yellow-400 text-yellow-400";
  const emptyClass = "fill-transparent text-muted-foreground";

  return (
    <button
      type="button"
      tabIndex={readOnly ? -1 : 0}
      disabled={readOnly}
      onClick={onClick}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        onHover(e.clientX - rect.left < rect.width / 2 ? 1 : 2);
      }}
      className={cn(
        "relative inline-flex items-center justify-center",
        !readOnly && "cursor-pointer",
      )}
      style={{ width: size, height: size }}
      aria-label="Set rating"
    >
      <StarIcon
        size={size}
        className={cn("absolute inset-0", emptyClass)}
        strokeWidth={1.5}
      />
      {fillHalves > 0 && (
        <span
          className="absolute inset-0 overflow-hidden"
          style={{ width: fillHalves === 1 ? size / 2 : size }}
        >
          <StarIcon size={size} className={filledClass} strokeWidth={1.5} />
        </span>
      )}
    </button>
  );
}
