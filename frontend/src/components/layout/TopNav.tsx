import { NavLink, useLocation } from "react-router";
import { cn } from "@/lib/utils";
import { isInSection } from "@/navigation";
import { sections } from "@/sections";

export function TopNav() {
  const { pathname } = useLocation();

  return (
    <header className="flex h-14 items-center gap-8 border-b border-border px-6">
      <NavLink to="/" className="text-lg font-semibold hover:text-foreground">
        Personal App
      </NavLink>
      <nav className="flex items-center gap-1">
        {sections.map((section) => {
          const isActive = isInSection(pathname, section);
          return (
            <NavLink
              key={section.path}
              to={section.path}
              className={cn(
                "relative px-3 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "text-foreground after:absolute after:bottom-[-13px] after:left-0 after:h-[2px] after:w-full after:bg-primary after:content-['']"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {section.label}
            </NavLink>
          );
        })}
      </nav>
    </header>
  );
}
