/** Sample rows shared by the data component stories. */
export interface SampleAlbum {
  id: string;
  name: string;
  artist: string;
  format: "Vinyl" | "CD";
  releaseDate: string;
  genre: string[];
}

const artists = [
  "Pink Floyd",
  "Miles Davis",
  "Radiohead",
  "Daft Punk",
  "Metallica",
  "Nina Simone",
  "Tool",
];
const genres = ["Rock", "Jazz", "Electronic", "Metal", "Soul", "Progressive Rock"];

export const sampleAlbums: SampleAlbum[] = Array.from({ length: 42 }, (_, i) => ({
  id: `album-${i}`,
  name:
    i === 3
      ? "The Rise and Fall of Ziggy Stardust and the Spiders from Mars (2012 Remaster)"
      : `Album ${String(i + 1).padStart(2, "0")}`,
  artist: artists[i % artists.length],
  format: i % 3 === 0 ? "CD" : "Vinyl",
  releaseDate: `${1965 + ((i * 7) % 60)}-0${(i % 9) + 1}-15`,
  genre: [genres[i % genres.length], ...(i % 4 === 0 ? [genres[(i + 2) % genres.length]] : [])],
}));
