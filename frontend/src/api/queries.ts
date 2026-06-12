import { queryOptions } from "@tanstack/react-query";
import { api } from "./client";

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

export const albumsQuery = queryOptions({
  queryKey: ["albums"],
  queryFn: async () => {
    const { data } = await api.GET("/api/albums");
    return data!;
  },
});

export const wishlistQuery = queryOptions({
  queryKey: ["wishlist-albums"],
  queryFn: async () => {
    const { data } = await api.GET("/api/wishlist/albums");
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
