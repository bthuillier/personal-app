export type AlbumFormat = "CD" | "Vinyl";
export interface PartialAlbum {
  name: string;
  artist: string;
  format: AlbumFormat;
  releaseDate: string;
}
