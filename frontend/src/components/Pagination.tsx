import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import {
  DEFAULT_PAGE_SIZE_OPTIONS,
  type Pagination,
} from "@/components/usePagination";

interface PaginationControlsProps<T> {
  pagination: Pagination<T>;
  pageSizeOptions?: number[];
}

export function PaginationControls<T>({
  pagination,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}: PaginationControlsProps<T>) {
  const {
    pageSize,
    pageIndex,
    pageCount,
    totalItems,
    rangeStart,
    rangeEnd,
    changePageSize,
    goToPreviousPage,
    goToNextPage,
  } = pagination;

  return (
    <div className="flex items-center justify-between gap-4 px-1 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <span>Rows per page</span>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => changePageSize(Number(v))}
        >
          <SelectTrigger size="sm" className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((opt) => (
              <SelectItem key={opt} value={String(opt)}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-4">
        <span>
          {rangeStart}–{rangeEnd} of {totalItems}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousPage}
            disabled={pageIndex === 0}
            aria-label="Previous page"
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextPage}
            disabled={pageIndex >= pageCount - 1}
            aria-label="Next page"
          >
            <ChevronRightIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}
