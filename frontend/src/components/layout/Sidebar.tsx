import { NavLink } from "react-router";
import { cn } from "@/lib/utils";

const sections = [
  {
    title: "Music",
    links: [
      { to: "/music/wishlist", label: "Wishlist" },
    ],
  },
];

export function Sidebar() {
  return (
    <aside className="flex w-56 flex-col gap-6 border-r border-border bg-muted/30 p-4">
      {sections.map((section) => (
        <div key={section.title} className="flex flex-col gap-1">
          <span className="px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {section.title}
          </span>
          <nav className="flex flex-col gap-0.5">
            {section.links.map((link) => (
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
        </div>
      ))}
    </aside>
  );
}
