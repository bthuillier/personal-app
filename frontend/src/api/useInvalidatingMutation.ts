import {
  useMutation,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";

/**
 * A mutation that refetches the given queries once it succeeds. Pass keys
 * from the feature's query definitions (`albumsQuery.queryKey`), so a renamed
 * key can't silently stop invalidating.
 */
export function useInvalidatingMutation<TVariables, TData = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  invalidates: QueryKey[],
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () =>
      Promise.all(
        invalidates.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      ),
  });
}
