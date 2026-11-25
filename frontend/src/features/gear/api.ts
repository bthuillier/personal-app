import { queryOptions, useMutation } from "@tanstack/react-query";
import { api } from "@/api/client";
import { useInvalidatingMutation } from "@/api/useInvalidatingMutation";
import type { ChangeStrings, StringRecommendationRequest } from "./types";

// ---------- Queries ----------

export const guitarsQuery = queryOptions({
  queryKey: ["guitars"],
  queryFn: async () => {
    const { data } = await api.GET("/api/guitars");
    return data!;
  },
});

export const amplifiersQuery = queryOptions({
  queryKey: ["amplifiers"],
  queryFn: async () => {
    const { data } = await api.GET("/api/amplifiers");
    return data!;
  },
});

export const pedalsQuery = queryOptions({
  queryKey: ["guitar-pedals"],
  queryFn: async () => {
    const { data } = await api.GET("/api/guitar-pedals");
    return data!;
  },
});

export function guitarEventsQuery(id: string) {
  return queryOptions({
    queryKey: ["guitar-events", id],
    queryFn: async () => {
      const { data } = await api.GET("/api/guitars/{id}/events", {
        params: { path: { id } },
      });
      return data!;
    },
    enabled: !!id,
  });
}

// ---------- Guitars ----------

/** Read-only computation: nothing to invalidate. */
export function useStringRecommendation(id: string) {
  return useMutation({
    mutationFn: async (body: StringRecommendationRequest) => {
      const { data } = await api.POST("/api/guitars/{id}/string-recommendation", {
        params: { path: { id } },
        body,
      });
      return data!;
    },
  });
}

export function useChangeGuitarStrings(id: string) {
  return useInvalidatingMutation(
    async (body: ChangeStrings) => {
      await api.POST("/api/guitars/{id}/commands", {
        params: { path: { id } },
        body,
      });
    },
    [guitarsQuery.queryKey, guitarEventsQuery(id).queryKey],
  );
}
