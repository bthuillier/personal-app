# Backend

Scala 3 API server built with Tapir, Cats Effect, and file-based JSON persistence.

## Tech Stack

- **Scala 3.7.4** with Scala CLI
- **Tapir 1.13.11** — typed HTTP endpoints with automatic OpenAPI generation
- **Netty** — HTTP server (port 8080)
- **Cats Effect 3.7.0** — functional IO runtime
- **FS2 3.12.2** — streaming and event bus (pub/sub via topics)
- **Circe 0.14.15** — JSON encoding/decoding

## Architecture

### Domain Modules

```
backend/
├── App.scala                          # Server bootstrap, CORS, routing
├── album-inventory/
│   ├── album/                         # Owned album collection
│   │   ├── Album.scala               # PartialAlbum(name, artist, format, releaseDate)
│   │   ├── AlbumFormat.scala          # Enum: CD, Vinyl
│   │   ├── AlbumService.scala         # Read albums from file store
│   │   ├── AlbumStore.scala           # File-backed store (indexed by artist first letter)
│   │   └── Albums.scala              # Tapir endpoint definitions
│   ├── wishlist/
│   │   ├── WishlistAlbum.scala        # Album + status
│   │   ├── WishlistStatus.scala       # Enum: Wanted → Ordered → Received
│   │   ├── WishlistService.scala      # Add, order, receive workflow
│   │   ├── WishlistStore.scala        # File-backed store, publishes events on receive
│   │   └── AlbumWishlists.scala       # Tapir endpoint definitions
│   └── eventbus/
│       └── EventBus.scala             # FS2 topic-based pub/sub trait
├── guitar-gear/
│   ├── GuitarGear.scala               # Module wiring
│   ├── guitar/
│   │   ├── Guitar.scala               # Model with specs, setup, event history
│   │   ├── GuitarCommand.scala        # Command ADT (ChangeStrings)
│   │   ├── GuitarEvent.scala          # Event ADT (StringsChanged)
│   │   ├── GuitarService.scala        # File-backed service with atomic state
│   │   └── Guitars.scala              # Tapir endpoint definitions
│   ├── amplifier/                     # Amplifier CRUD
│   └── pedal/                         # Pedal CRUD
└── json/
    └── JsonLoader.scala               # Utilities for reading/writing JSON files
```

### Key Patterns

**File-based persistence** — Each entity type maps to JSON files on disk. No database needed. The `DB_BASE_PATH` env var controls where data is stored.

**Event-driven workflow** — When a wishlist album is marked as "Received", the wishlist store publishes an event via an FS2 topic. The album store subscribes to this topic and automatically adds the album to the collection.

**Tapir endpoints** — All routes are defined as typed Tapir endpoint descriptions. This enables:
- Automatic request/response validation
- OpenAPI spec generation (`generateOpenApi.scala`)
- Type-safe server logic binding

**Event sourcing (guitars)** — Guitars track their history as a sequence of events (e.g., `StringsChanged`). Commands are validated and produce events that are appended to the guitar's event list.

## Running

```bash
# From project root
scala-cli run .
```

Server starts on `http://localhost:8080` with CORS enabled for all origins.

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_BASE_PATH` | Directory for JSON data files | `data` |

## OpenAPI Generation

The backend defines all endpoints in Tapir. To regenerate `openapi.yaml`:

```bash
scala-cli run generateOpenApi.scala
```

This produces the OpenAPI 3.1 spec at the project root, which the frontend uses to generate typed API clients.

## Testing

```bash
scala-cli test .
```

Tests use the in-memory store implementations (no file I/O needed).
