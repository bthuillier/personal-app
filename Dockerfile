# ---------- Frontend build ----------
FROM node:22-alpine AS frontend
RUN npm install -g pnpm@10
WORKDIR /build
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY frontend/ ./
RUN pnpm build

# ---------- Backend build ----------
FROM eclipse-temurin:21-jdk-noble AS backend
ARG SCALA_CLI_VERSION=1.9.1
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && case "$(uname -m)" in \
         x86_64) SUFFIX=x86_64-pc-linux ;; \
         aarch64) SUFFIX=aarch64-pc-linux ;; \
         *) echo "Unsupported architecture: $(uname -m)" && exit 1 ;; \
       esac \
    && curl -fL "https://github.com/VirtusLab/scala-cli/releases/download/v${SCALA_CLI_VERSION}/scala-cli-${SUFFIX}.gz" \
       | gunzip > /usr/local/bin/scala-cli \
    && chmod +x /usr/local/bin/scala-cli
WORKDIR /build
COPY project.scala generateOpenApi.scala ./
COPY backend/ backend/
RUN scala-cli --power package . --assembly --preamble=false --main-class App -o app.jar

# ---------- Runtime ----------
FROM eclipse-temurin:21-jre-noble
RUN apt-get update \
    && apt-get install -y --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=backend /build/app.jar app.jar
COPY --from=frontend /build/dist frontend/dist
COPY --chmod=755 docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
ENV DB_BASE_PATH=/data \
    FRONTEND_DIST=/app/frontend/dist
EXPOSE 8080
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["java", "-jar", "/app/app.jar"]
