import { createBrowserRouter, Navigate } from "react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { WishlistPage } from "@/pages/music/WishlistPage";
import { AlbumListPage } from "@/pages/music/AlbumListPage";
import { GuitarListPage } from "@/pages/gear/GuitarListPage";
import { GuitarDetailPage } from "@/pages/gear/GuitarDetailPage";
import { AmplifierListPage } from "@/pages/gear/AmplifierListPage";
import { PedalListPage } from "@/pages/gear/PedalListPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/gear/guitars" replace /> },
      { path: "gear/guitars", element: <GuitarListPage /> },
      { path: "gear/guitars/:serial", element: <GuitarDetailPage /> },
      { path: "gear/amplifiers", element: <AmplifierListPage /> },
      { path: "gear/pedals", element: <PedalListPage /> },
      { path: "music/wishlist", element: <WishlistPage /> },
      { path: "music/albums", element: <AlbumListPage /> },
    ],
  },
]);
