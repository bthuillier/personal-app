export type AlbumFormat = "CD" | "Vinyl";

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
