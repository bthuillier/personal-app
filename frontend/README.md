# Frontend

React 19 single-page application built with TypeScript, Vite, and TailwindCSS v4.

## Tech Stack

- **React 19** with TypeScript 5.9
- **Vite 8** — dev server and build tool
- **TailwindCSS v4** — utility-first styling with OKLch color space
- **shadcn/ui** — component library (base-nova style)
- **TanStack React Query** — server state management, caching, mutations
- **openapi-fetch** — fully typed API client generated from the backend's OpenAPI spec
- **React Router 7** — client-side routing
- **Lucide React** — icons
- **sonner** — toast notifications

## Project Structure

```
src/
├── main.tsx                 # App entry (React 19 + QueryClient + Router)
├── index.css                # Tailwind imports + OKLch theme variables
├── routes.tsx               # Router, built from `sections`
├── navigation.ts            # AppSection / SectionPage types + URL helpers
├── sections.ts              # Top-level areas: routes, top nav and sidebar derive from it
├── api/
│   ├── client.ts            # openapi-fetch instance, QueryClient, error toasts
│   ├── schema.ts            # Generated from openapi.yaml (types + enum value arrays)
│   ├── error.ts             # ApiError + error message helper
│   └── useInvalidatingMutation.ts
├── features/                # One folder per domain, mirroring the backend
│   ├── music/
│   │   ├── section.tsx      # Pages, paths and sidebar labels of the area
│   │   ├── api.ts           # Queries + mutations
│   │   ├── types.ts         # Domain type aliases + enum values
│   │   ├── pages/           # AlbumList, AlbumDetail, Wishlist, MusicHome, YearRecap
│   │   └── components/      # GenreCell, ReviewEditor
│   └── gear/                # Same layout (+ hooks/, lib/ for tunings and strings)
├── pages/                   # App-level pages: Home, 404, route error
├── components/              # Generic component library (see Storybook)
│   ├── ui/                  # shadcn/ui primitives
│   ├── layout/              # AppLayout, TopNav, Sidebar, Page, PageHeader, Section
│   ├── data/                # CollectionPage, DataTable, FilterBar, QueryGate, ...
│   ├── display/             # StatCard, Panel, BarList, ErrorState, StarRating, ...
│   └── form/                # ItemForm
└── lib/                     # cn(), formatEnum(), countBy()
```

**Adding a page:** create it in `features/<domain>/pages/` and declare it in that
domain's `section.tsx` — give it a `label` to list it in the sidebar.

**Component library:** `pnpm storybook` (or `just storybook`) on http://localhost:6006.
Each generic component has a `*.stories.tsx` next to it.

## Getting Started

```bash
# Install dependencies
pnpm install

# Start dev server (proxies /api to backend on :8080)
pnpm dev

# Build for production
pnpm build

# Lint
pnpm lint
```

The dev server runs on `http://localhost:5173`. The Vite config proxies all `/api` requests to `http://localhost:8080` (the backend).

## API Integration

The frontend uses a fully typed API client generated from the backend's OpenAPI spec.

### How it works

1. Backend defines endpoints with Tapir (typed Scala)
2. `generateOpenApi.scala` produces `openapi.yaml`
3. `openapi-typescript` generates `src/api/schema.ts` (types, plus `--enum-values` arrays such as `albumFormatValues`)
4. `openapi-fetch` creates a typed client using those types

### Regenerating types

When backend endpoints change:

```bash
# From project root — regenerate the OpenAPI spec
scala-cli run generateOpenApi.scala

# From frontend/ — regenerate TypeScript types
pnpm generate-api
```

### Usage example

```typescript
import { api } from "@/api/client";

// Fully typed — paths, params, request body, and response
const { data } = await api.GET("/wishlist/albums");

await api.POST("/wishlist/albums", {
  body: { name: "OK Computer", artist: "Radiohead", format: "Vinyl", releaseDate: "1997-06-16" }
});
```

## Styling

- **TailwindCSS v4** with OKLch color space for perceptually uniform colors
- **Dark/light mode** via `next-themes` (auto-detects system preference)
- Theme variables defined in `src/index.css`
- shadcn/ui components in `src/components/ui/`

## Adding UI Components

This project uses shadcn/ui. To add new components:

```bash
npx shadcn@latest add <component-name>
```

Configuration is in `components.json` (base-nova style, lucide icons, `@/` import alias).
