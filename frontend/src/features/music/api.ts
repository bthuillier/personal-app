import { queryOptions } from "@tanstack/react-query";
import { api } from "@/api/client";
import { useInvalidatingMutation } from "@/api/useInvalidatingMutation";
import type {
  AddAlbumToWishlist,
  AlbumDetails,
  CreateAlbum,
  Review,
} from "./types";

// ---------- Queries ----------

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

// ---------- Albums ----------

export function useCreateAlbum() {
  return useInvalidatingMutation(
    async (body: CreateAlbum) => {
      await api.POST("/api/albums", { body });
    },
    [albumsQuery.queryKey],
  );
}

export function useAddAlbumGenre(albumId: string) {
  return useInvalidatingMutation(
    async (genre: string) => {
      await api.POST("/api/albums/{albumId}/genres", {
        params: { path: { albumId }, query: { genre } },
      });
    },
    [albumsQuery.queryKey],
  );
}

export function useRemoveAlbumGenre(albumId: string) {
  return useInvalidatingMutation(
    async (genre: string) => {
      await api.DELETE("/api/albums/{albumId}/genres", {
        params: { path: { albumId }, query: { genre } },
      });
    },
    [albumsQuery.queryKey],
  );
}

export function useReviewAlbum(albumId: string) {
  return useInvalidatingMutation(
    async (body: Review) => {
      await api.POST("/api/albums/{albumId}/review", {
        params: { path: { albumId } },
        body,
      });
    },
    [albumsQuery.queryKey],
  );
}

/** Resolves with the updated album: a format change gives it a new id. */
export function useUpdateAlbumDetails(albumId: string) {
  return useInvalidatingMutation(
    async (body: AlbumDetails) => {
      const { data } = await api.PUT("/api/albums/{albumId}/details", {
        params: { path: { albumId } },
        body,
      });
      return data!;
    },
    [albumsQuery.queryKey],
  );
}

// ---------- Wishlist ----------

export function useAddToWishlist() {
  return useInvalidatingMutation(
    async (body: AddAlbumToWishlist) => {
      await api.POST("/api/wishlist/albums", { body });
    },
    [wishlistQuery.queryKey],
  );
}

export function useOrderWishlistAlbum() {
  return useInvalidatingMutation(
    async (id: string) => {
      await api.POST("/api/wishlist/albums/{id}/order", {
        params: { path: { id } },
      });
    },
    [wishlistQuery.queryKey],
  );
}

/** Receiving an album also adds it to the collection (server-side event). */
export function useReceiveWishlistAlbum() {
  return useInvalidatingMutation(
    async (id: string) => {
      await api.POST("/api/wishlist/albums/{id}/received", {
        params: { path: { id } },
      });
    },
    [wishlistQuery.queryKey, albumsQuery.queryKey],
  );
}
