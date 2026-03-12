import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ColorVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline";

interface StatusBadgeProps<T extends string> {
  status: T;
  colorMap: Record<T, ColorVariant>;
  className?: string;
}

export function StatusBadge<T extends string>({
  status,
  colorMap,
  className,
}: StatusBadgeProps<T>) {
  return (
    <Badge variant={colorMap[status]} className={cn(className)}>
      {status}
    </Badge>
  );
}
