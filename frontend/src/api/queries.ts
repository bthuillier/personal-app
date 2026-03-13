import { queryOptions } from "@tanstack/react-query";
import { api } from "./client";

export const guitarsQuery = queryOptions({
  queryKey: ["guitars"],
  queryFn: async () => {
    const { data } = await api.GET("/guitars");
    return data!;
  },
});

export const amplifiersQuery = queryOptions({
  queryKey: ["amplifiers"],
  queryFn: async () => {
    const { data } = await api.GET("/amplifiers");
    return data!;
  },
});

export const pedalsQuery = queryOptions({
  queryKey: ["guitar-pedals"],
  queryFn: async () => {
    const { data } = await api.GET("/guitar-pedals");
    return data!;
  },
});

export const albumsQuery = queryOptions({
  queryKey: ["albums"],
  queryFn: async () => {
    const { data } = await api.GET("/albums");
    return data!;
  },
});

export const wishlistQuery = queryOptions({
  queryKey: ["wishlist-albums"],
  queryFn: async () => {
    const { data } = await api.GET("/wishlist/albums");
    return data!;
  },
});

export function guitarEventsQuery(id: string) {
  return queryOptions({
    queryKey: ["guitar-events", id],
    queryFn: async () => {
      const { data } = await api.GET("/guitars/{id}/events", {
        params: { path: { id } },
      });
      return data!;
    },
    enabled: !!id,
  });
}
