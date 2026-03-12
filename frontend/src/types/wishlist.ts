import type { AlbumFormat } from "./album";

export type WishlistStatus = "Wanted" | "Ordered" | "Received";

export interface WishlistAlbum {
  name: string;
  artist: string;
  format: AlbumFormat;
  releaseDate: string;
  status: WishlistStatus;
}

export interface AddAlbumToWishlist {
  name: string;
  artist: string;
  format: AlbumFormat;
  releaseDate: string;
}
