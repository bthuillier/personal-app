import type { AppSection } from "@/navigation";
import { AlbumDetailPage } from "./pages/AlbumDetailPage";
import { AlbumListPage } from "./pages/AlbumListPage";
import { MusicHomePage } from "./pages/MusicHomePage";
import { WishlistPage } from "./pages/WishlistPage";
import { YearRecapPage } from "./pages/YearRecapPage";

export const musicSection: AppSection = {
  label: "Music",
  path: "/music",
  pages: [
    { path: "", label: "Overview", element: <MusicHomePage /> },
    { path: "wishlist", label: "Wishlist", element: <WishlistPage /> },
    { path: "albums", label: "Albums", element: <AlbumListPage /> },
    { path: "albums/:id", element: <AlbumDetailPage /> },
    { path: "recap", label: "Recap", element: <YearRecapPage /> },
  ],
};
