import { NavLink, useLocation } from "react-router";
import { cn } from "@/lib/utils";

const sectionsByDomain: Record<string, { to: string; label: string }[]> = {
  gear: [
    { to: "/gear/guitars", label: "Guitars" },
    { to: "/gear/amplifiers", label: "Amplifiers" },
    { to: "/gear/pedals", label: "Pedals" },
  ],
  music: [
    { to: "/music/wishlist", label: "Wishlist" },
    { to: "/music/albums", label: "Albums" },
  ],
};

export function Sidebar() {
  const { pathname } = useLocation();
  const domain = pathname.split("/")[1] ?? "gear";
  const links = sectionsByDomain[domain] ?? sectionsByDomain.gear;

  return (
    <aside className="flex w-56 flex-col gap-1 border-r border-border bg-muted/30 p-4">
      <nav className="flex flex-col gap-0.5">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              cn(
                "rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted",
              )
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
