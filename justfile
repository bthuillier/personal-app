set dotenv-load

default:
    @just --list

# Build the frontend and run the whole app (API + UI) on http://localhost:8080
run: build-frontend
    scala-cli run . --main-class App

# Format backend and frontend
format: format-backend format-frontend

format-backend:
    scala-cli fmt .

format-frontend:
    cd frontend && pnpm lint --fix

# Update dependencies for backend and frontend
update: update-backend update-frontend

update-backend:
    scala-cli --power dependency-update --all .

update-frontend:
    cd frontend && pnpm update

# Build backend and frontend
build: build-backend build-frontend

build-backend:
    scala-cli compile .

build-frontend:
    cd frontend && pnpm install && pnpm build

# Build the docker image (frontend + backend, served on port 8080)
docker-build:
    docker build -t personal-app .

# Run the docker image, mounting the git repo containing $DB_BASE_PATH at /data
docker-run:
    docker run --rm -p 8080:8080 \
      -v "$(git -C "$DB_BASE_PATH" rev-parse --show-toplevel):/data" \
      -e DB_BASE_PATH="/data/$(git -C "$DB_BASE_PATH" rev-parse --show-prefix)" \
      personal-app

# Rebuild the image and (re)start it as a persistent service that comes back
# whenever Docker is running. Run this whenever you want the latest build live.
redeploy: docker-build
    -docker rm -f personal-app
    docker run -d --name personal-app --restart unless-stopped -p 8080:8080 \
      -v "$(git -C "$DB_BASE_PATH" rev-parse --show-toplevel):/data" \
      -e DB_BASE_PATH="/data/$(git -C "$DB_BASE_PATH" rev-parse --show-prefix)" \
      personal-app
    @echo "personal-app is running on http://localhost:8080"

# Stop and remove the persistent service
docker-stop:
    -docker rm -f personal-app

# Tail logs from the persistent service
docker-logs:
    docker logs -f personal-app

# Generate OpenAPI spec and frontend types
generate-openapi: generate-openapi-backend generate-openapi-ui

generate-openapi-backend:
    scala-cli run . --main-class generateOpenApi

generate-openapi-ui:
    cd frontend && pnpm generate-api
