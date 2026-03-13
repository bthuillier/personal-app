import { NavLink, useLocation } from "react-router";
import { cn } from "@/lib/utils";

const sectionsByDomain: Record<string, { to: string; label: string }[]> = {
  gear: [
    { to: "/gear", label: "Overview" },
    { to: "/gear/guitars", label: "Guitars" },
    { to: "/gear/amplifiers", label: "Amplifiers" },
    { to: "/gear/pedals", label: "Pedals" },
  ],
  music: [
    { to: "/music", label: "Overview" },
    { to: "/music/wishlist", label: "Wishlist" },
    { to: "/music/albums", label: "Albums" },
  ],
};

export function Sidebar() {
  const { pathname } = useLocation();
  const domain = pathname.split("/")[1];
  const links = sectionsByDomain[domain];

  if (!links) return null;

  return (
    <aside className="flex w-56 flex-col gap-1 border-r border-border bg-muted/30 py-4 pl-4">
      <nav className="flex flex-col gap-0.5">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === `/gear` || link.to === `/music`}
            className={({ isActive }) =>
              cn(
                "border-l-2 px-3 py-1.5 text-sm transition-colors",
                isActive
                  ? "border-primary bg-primary/10 text-foreground font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground",
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
