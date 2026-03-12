import type { PartialAlbum } from "@/types/album";
import { apiGet } from "./client";

export function fetchAlbums(): Promise<PartialAlbum[]> {
  return apiGet("/albums");
}
