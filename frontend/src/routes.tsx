import { createBrowserRouter } from "react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { pageUrl } from "@/navigation";
import { HomePage } from "@/pages/HomePage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { RouteErrorPage } from "@/pages/RouteErrorPage";
import { sections } from "@/sections";

const sectionRoutes = sections.flatMap((section) =>
  section.pages.map((page) => ({
    path: pageUrl(section, page).slice(1),
    element: page.element,
  })),
);

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
          ...sectionRoutes,
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
