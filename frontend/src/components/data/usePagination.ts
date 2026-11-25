import { useMemo, useState } from "react";

export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export interface Pagination<T> {
  pagedData: T[];
  pageSize: number;
  pageIndex: number;
  pageCount: number;
  totalItems: number;
  rangeStart: number;
  rangeEnd: number;
  changePageSize: (size: number) => void;
  goToPreviousPage: () => void;
  goToNextPage: () => void;
}

export function usePagination<T>(
  data: T[],
  initialPageSize = 25,
): Pagination<T> {
  const [pageSize, setPageSize] = useState<number>(initialPageSize);
  const [pageIndex, setPageIndex] = useState<number>(0);

  const pageCount = Math.max(1, Math.ceil(data.length / pageSize));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);

  const pagedData = useMemo(() => {
    const start = safePageIndex * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, safePageIndex, pageSize]);

  const rangeStart = data.length === 0 ? 0 : safePageIndex * pageSize + 1;
  const rangeEnd = Math.min(data.length, (safePageIndex + 1) * pageSize);

  return {
    pagedData,
    pageSize,
    pageIndex: safePageIndex,
    pageCount,
    totalItems: data.length,
    rangeStart,
    rangeEnd,
    changePageSize: (size) => {
      setPageSize(size);
      setPageIndex(0);
    },
    goToPreviousPage: () =>
      setPageIndex((i) => Math.max(0, Math.min(i, pageCount - 1) - 1)),
    goToNextPage: () =>
      setPageIndex((i) => Math.min(pageCount - 1, i + 1)),
  };
}
