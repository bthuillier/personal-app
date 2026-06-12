# Personal App

A personal collection management app for tracking music albums and guitar gear. Built with a Scala/Tapir backend and a React/TypeScript frontend.

## What it does

- **Music Wishlist** — Add albums you want, track their status through Wanted → Ordered → Received
- **Album Collection** — Browse your owned albums with search, sort, and filter by format/year
- **Guitar Gear** — Manage guitars (with string change history), amplifiers, and pedals

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Scala 3, Tapir, Netty, Cats Effect, FS2, Circe |
| Frontend | React 19, TypeScript, Vite, TailwindCSS v4, TanStack Query, React Router |
| UI | shadcn/ui, Lucide icons, OKLch color themes |
| API Contract | OpenAPI 3.1 (auto-generated from Tapir endpoints) |
| Persistence | File-based JSON (no external database) |

## Project Structure

```
personal-app/
├── backend/                  # Scala API server (port 8080)
│   ├── App.scala             # Entry point, server setup
│   ├── album-inventory/      # Music domain (albums, wishlist, event bus)
│   ├── guitar-gear/          # Gear domain (guitars, amps, pedals)
│   └── json/                 # JSON file I/O utilities
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── api/              # Typed API client (generated from OpenAPI)
│   │   ├── pages/            # Route pages
│   │   └── components/       # Reusable UI components
│   └── ...
├── openapi.yaml              # Auto-generated OpenAPI spec
├── generateOpenApi.scala     # Script to regenerate the spec
└── .env                      # Environment variables
```

## Prerequisites

- **Scala CLI** — [install](https://scala-cli.virtuslab.org/install)
- **Node.js 22** (see `.nvmrc`)
- **pnpm** — `npm install -g pnpm`

## Getting Started

### Quick start (one command)

With a `.env` file in place (see below), build the frontend and run everything from the backend:

```bash
just run
```

Then open `http://localhost:8080` — the backend serves both the API (under `/api`) and the built frontend (with SPA fallback to `index.html`). The frontend build directory can be overridden with the `FRONTEND_DIST` env var (defaults to `frontend/dist`).

### Development setup (hot reload)

### 1. Set up environment

Create a `.env` file at the project root:

```env
DB_BASE_PATH=/path/to/your/data/directory
```

The backend stores JSON files in this directory. It will be created if it doesn't exist.

### 2. Start the backend

```bash
scala-cli run . --main-class App
```

The API server starts on `http://localhost:8080`.

### 3. Start the frontend

```bash
cd frontend
pnpm install
pnpm dev
```

The dev server starts on `http://localhost:5173` and proxies `/api` requests to the backend.

### 4. Open the app

Navigate to `http://localhost:5173`.

## API

All endpoints are documented in `openapi.yaml`. To regenerate it after changing backend endpoints:

```bash
scala-cli run . --main-class generateOpenApi
```

Or via [just](https://github.com/casey/just):

```bash
just generate-openapi
```

To regenerate the frontend TypeScript types from the spec:

```bash
cd frontend
pnpm generate-api
```

### Endpoints

All API endpoints are prefixed with `/api`, so the backend can also serve the frontend static files at the root path.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/albums` | List all owned albums |
| GET | `/api/wishlist/albums` | List wishlist albums |
| POST | `/api/wishlist/albums` | Add album to wishlist |
| POST | `/api/wishlist/albums/order` | Mark album as ordered |
| POST | `/api/wishlist/albums/received` | Mark album as received (moves to collection) |
| GET | `/api/guitars` | List all guitars |
| GET | `/api/guitars/{serialNumber}/events` | Guitar event history |
| POST | `/api/guitars/{serialNumber}/commands` | Execute command (e.g. ChangeStrings) |
| GET | `/api/amplifiers` | List amplifiers |
| GET | `/api/guitar-pedals` | List pedals |

## Data Storage

No external database. All data is stored as JSON files under `$DB_BASE_PATH`:

```
$DB_BASE_PATH/
├── music-inventory/
│   ├── wishlist.json          # Wishlist albums
│   └── albums/
│       ├── a.json             # Albums by artists starting with A
│       ├── b.json             # Albums by artists starting with B
│       └── ...
└── guitar-gear/
    ├── guitar/                # One JSON file per guitar (by serial number)
    ├── guitar-amp/            # One JSON file per amplifier
    └── guitar-pedal/          # One JSON file per pedal
```
