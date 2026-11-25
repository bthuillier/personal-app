import { NavLink, useLocation } from "react-router";
import { cn } from "@/lib/utils";
import { isInSection, pageUrl } from "@/navigation";
import { sections } from "@/sections";

export function Sidebar() {
  const { pathname } = useLocation();
  const section = sections.find((s) => isInSection(pathname, s));
  if (!section) return null;

  const links = section.pages.filter((page) => page.label);

  return (
    <aside className="flex w-56 flex-col gap-1 border-r border-border bg-muted/30 py-4 pl-4">
      <nav className="flex flex-col gap-0.5">
        {links.map((page) => (
          <NavLink
            key={page.path}
            to={pageUrl(section, page)}
            // The overview link must not stay active on every page of the section.
            end={page.path === ""}
            className={({ isActive }) =>
              cn(
                "border-l-2 px-3 py-1.5 text-sm transition-colors",
                isActive
                  ? "border-primary bg-primary/10 text-foreground font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )
            }
          >
            {page.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
