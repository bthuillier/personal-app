#!/bin/sh
set -e

# Bind-mounted repos may be owned by a different uid than the container user.
git config --global safe.directory '*'

# The app commits every data change to git, so DB_BASE_PATH must live inside
# a git repository. Initialize one on first run if none is found.
mkdir -p "$DB_BASE_PATH"
if ! git -C "$DB_BASE_PATH" rev-parse --git-dir >/dev/null 2>&1; then
  echo "No git repository found at $DB_BASE_PATH, initializing one"
  git init -q "$DB_BASE_PATH"
  git -C "$DB_BASE_PATH" config user.name "personal-app"
  git -C "$DB_BASE_PATH" config user.email "personal-app@localhost"
fi

exec "$@"
