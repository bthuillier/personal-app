import { createBrowserRouter, Navigate } from "react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { WishlistPage } from "@/pages/music/WishlistPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/music/wishlist" replace /> },
      { path: "music/wishlist", element: <WishlistPage /> },
    ],
  },
]);
