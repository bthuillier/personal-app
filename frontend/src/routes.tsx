import { createBrowserRouter } from "react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { HomePage } from "@/pages/HomePage";
import { GearHomePage } from "@/pages/gear/GearHomePage";
import { GuitarListPage } from "@/pages/gear/GuitarListPage";
import { GuitarDetailPage } from "@/pages/gear/GuitarDetailPage";
import { AmplifierListPage } from "@/pages/gear/AmplifierListPage";
import { PedalListPage } from "@/pages/gear/PedalListPage";
import { MusicHomePage } from "@/pages/music/MusicHomePage";
import { WishlistPage } from "@/pages/music/WishlistPage";
import { AlbumListPage } from "@/pages/music/AlbumListPage";
import { AlbumDetailPage } from "@/pages/music/AlbumDetailPage";
import { YearRecapPage } from "@/pages/music/YearRecapPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { RouteErrorPage } from "@/pages/RouteErrorPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    // Fallback if the layout itself fails.
    errorElement: <RouteErrorPage />,
    children: [
      {
        // Page errors render inside the layout, keeping the navigation.
        errorElement: <RouteErrorPage />,
        children: [
          { index: true, element: <HomePage /> },
          { path: "gear", element: <GearHomePage /> },
          { path: "gear/guitars", element: <GuitarListPage /> },
          { path: "gear/guitars/:id", element: <GuitarDetailPage /> },
          { path: "gear/amplifiers", element: <AmplifierListPage /> },
          { path: "gear/pedals", element: <PedalListPage /> },
          { path: "music", element: <MusicHomePage /> },
          { path: "music/wishlist", element: <WishlistPage /> },
          { path: "music/albums", element: <AlbumListPage /> },
          { path: "music/albums/:id", element: <AlbumDetailPage /> },
          { path: "music/recap", element: <YearRecapPage /> },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
