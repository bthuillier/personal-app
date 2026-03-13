import { NavLink, useLocation } from "react-router";
import { cn } from "@/lib/utils";

const domains = [
  { to: "/gear/guitars", label: "Gear", prefix: "/gear" },
  { to: "/music/wishlist", label: "Music", prefix: "/music" },
];

export function TopNav() {
  const { pathname } = useLocation();

  return (
    <header className="flex h-14 items-center gap-8 border-b border-border px-6">
      <h1 className="text-lg font-semibold">Personal App</h1>
      <nav className="flex items-center gap-1">
        {domains.map((domain) => {
          const isActive = pathname.startsWith(domain.prefix);
          return (
            <NavLink
              key={domain.prefix}
              to={domain.to}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {domain.label}
            </NavLink>
          );
        })}
      </nav>
    </header>
  );
}
