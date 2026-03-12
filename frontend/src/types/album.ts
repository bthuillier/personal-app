import type { AlbumFormat } from "./wishlist";

export interface PartialAlbum {
  name: string;
  artist: string;
  format: AlbumFormat;
  releaseDate: string;
}
