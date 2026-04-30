import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import type { components } from "./schema";

export function useCreateAlbum() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: components["schemas"]["CreateAlbum"]) => {
      await api.POST("/albums", { body });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["albums"] }),
  });
}

export function useAddAlbumGenre(albumId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (genre: string) => {
      await api.POST("/albums/{albumId}/genres", {
        params: { path: { albumId }, query: { genre } },
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["albums"] }),
  });
}

export function useRemoveAlbumGenre(albumId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (genre: string) => {
      await api.DELETE("/albums/{albumId}/genres", {
        params: { path: { albumId }, query: { genre } },
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["albums"] }),
  });
}

export function useReviewAlbum(albumId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: components["schemas"]["Review"]) => {
      await api.POST("/albums/{albumId}/review", {
        params: { path: { albumId } },
        body,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["albums"] }),
  });
}

export function useAddToWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: components["schemas"]["AddAlbumToWishlist"]) => {
      await api.POST("/wishlist/albums", { body });
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["wishlist-albums"] }),
  });
}

export function useOrderWishlistAlbum() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.POST("/wishlist/albums/{id}/order", {
        params: { path: { id } },
      });
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["wishlist-albums"] }),
  });
}

export function useReceiveWishlistAlbum() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.POST("/wishlist/albums/{id}/received", {
        params: { path: { id } },
      });
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["wishlist-albums"] }),
  });
}

export function useStringRecommendation(id: string) {
  return useMutation({
    mutationFn: async (
      body: components["schemas"]["StringRecommendationRequest"],
    ) => {
      const { data } = await api.POST("/guitars/{id}/string-recommendation", {
        params: { path: { id } },
        body,
      });
      return data!;
    },
  });
}

export function useChangeGuitarStrings(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: components["schemas"]["ChangeStrings"]) => {
      await api.POST("/guitars/{id}/commands", {
        params: { path: { id } },
        body,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guitars"] });
      queryClient.invalidateQueries({ queryKey: ["guitar-events", id] });
    },
  });
}
