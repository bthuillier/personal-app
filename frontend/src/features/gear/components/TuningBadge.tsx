import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatNotes, getTuningName } from "@/features/gear/lib/tuning";
import type { GuitarTuning } from "@/features/gear/types";


export function TuningBadge({ tuning }: { tuning: GuitarTuning }) {
  const notes = tuning.notes;
  if (!notes || notes.length === 0) return <span>-</span>;

  const name = getTuningName(notes);
  const notesStr = formatNotes(notes);

  if (name) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="outline" className="cursor-default">
            {name}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>{notesStr}</TooltipContent>
      </Tooltip>
    );
  }

  return <Badge variant="outline">{notesStr}</Badge>;
}
