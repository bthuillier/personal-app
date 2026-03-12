import type { WishlistAlbum, AddAlbumToWishlist } from "@/types/wishlist";
import { apiGet, apiPost } from "./client";

export function fetchWishlistAlbums(): Promise<WishlistAlbum[]> {
  return apiGet("/wishlist/albums");
}

export function addAlbumToWishlist(album: AddAlbumToWishlist): Promise<void> {
  return apiPost("/wishlist/albums", album);
}

export function orderAlbum(name: string, artist: string): Promise<void> {
  const params = new URLSearchParams({ name, artist });
  return apiPost(`/wishlist/albums/order?${params}`);
}

export function markAlbumReceived(name: string, artist: string): Promise<void> {
  const params = new URLSearchParams({ name, artist });
  return apiPost(`/wishlist/albums/received?${params}`);
}
