import {
  useMutation,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { api } from "./client";
import {
  albumsQuery,
  guitarEventsQuery,
  guitarsQuery,
  wishlistQuery,
} from "./queries";
import type { components } from "./schema";

type Schemas = components["schemas"];

/**
 * A mutation that refetches the given queries once it succeeds. Keys come
 * from `queries.ts`, so a renamed key can't silently stop invalidating.
 */
function useInvalidatingMutation<TVariables, TData = void>(
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

// ---------- Albums ----------

export function useCreateAlbum() {
  return useInvalidatingMutation(
    async (body: Schemas["CreateAlbum"]) => {
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
    async (body: Schemas["Review"]) => {
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
    async (body: Schemas["AlbumDetails"]) => {
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
    async (body: Schemas["AddAlbumToWishlist"]) => {
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

// ---------- Guitars ----------

/** Read-only computation: nothing to invalidate. */
export function useStringRecommendation(id: string) {
  return useMutation({
    mutationFn: async (body: Schemas["StringRecommendationRequest"]) => {
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
    async (body: Schemas["ChangeStrings"]) => {
      await api.POST("/api/guitars/{id}/commands", {
        params: { path: { id } },
        body,
      });
    },
    [guitarsQuery.queryKey, guitarEventsQuery(id).queryKey],
  );
}
