default:
    @just --list

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

# Generate OpenAPI spec and frontend types
generate-openapi: generate-openapi-backend generate-openapi-ui

generate-openapi-backend:
    scala-cli run . --main-class generateOpenApi

generate-openapi-ui:
    cd frontend && pnpm generate-api
