import type { AppSection } from "@/navigation";
import { AmplifierListPage } from "./pages/AmplifierListPage";
import { GearHomePage } from "./pages/GearHomePage";
import { GuitarDetailPage } from "./pages/GuitarDetailPage";
import { GuitarListPage } from "./pages/GuitarListPage";
import { PedalListPage } from "./pages/PedalListPage";

export const gearSection: AppSection = {
  label: "Gear",
  path: "/gear",
  pages: [
    { path: "", label: "Overview", element: <GearHomePage /> },
    { path: "guitars", label: "Guitars", element: <GuitarListPage /> },
    { path: "guitars/:id", element: <GuitarDetailPage /> },
    { path: "amplifiers", label: "Amplifiers", element: <AmplifierListPage /> },
    { path: "pedals", label: "Pedals", element: <PedalListPage /> },
  ],
};
