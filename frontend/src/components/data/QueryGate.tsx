import type { ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { LoadingState } from "@/components/display/EmptyState";
import { ErrorState } from "@/components/display/ErrorState";

/** The parts of a `useQuery` result the gate reads (easy to fake in stories). */
export type QueryState<TData = unknown> = Pick<
  UseQueryResult<TData>,
  "data" | "isPending" | "isError" | "error" | "refetch"
>;

export interface QueryGateProps {
  queries: QueryState[];
  children?: ReactNode;
}

/**
 * Renders `children` once every query has data; until then a loading state,
 * or an error with a retry (refetching only the failed queries).
 *
 * A failed background refetch keeps the previous data on screen (React Query
 * reports `isError` but keeps `data`); the global toast reports it instead.
 */
export function QueryGate({ queries, children }: QueryGateProps) {
  const failed = queries.filter((q) => q.isError && q.data === undefined);
  if (failed.length > 0) {
    return (
      <ErrorState
        error={failed[0].error}
        onRetry={() => failed.forEach((q) => void q.refetch())}
      />
    );
  }
  if (queries.some((q) => q.isPending)) return <LoadingState />;
  return <>{children}</>;
}
