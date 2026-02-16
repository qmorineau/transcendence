#!/bin/sh
set -e

cd /app
# 0) Ensure data dir is writable by 'node'
mkdir -p /app/data
chown -R node:node /app/data
chown -R node:node /app/public

# 1) Where prisma CLI should live (installed as dev dep)
PRISMA_BIN="/app/node_modules/.bin/prisma"

if [ ! -x "$PRISMA_BIN" ]; then
  echo "[entrypoint] ERROR: Prisma CLI not found at $PRISMA_BIN"
  echo "[entrypoint] Hints: "
  echo "  - Ensure 'prisma' is in devDependencies and 'npm ci' ran in the build stage."
  echo "  - Ensure node_modules were copied to the runtime image."
  exit 1
fi

echo "[entrypoint] Applying Prisma schema..."
if [ -d /app/prisma/migrations ] && [ "$(ls -A /app/prisma/migrations 2>/dev/null)" ]; then
  echo "[entrypoint] Found migrations → migrate deploy"
  su-exec node "$PRISMA_BIN" migrate deploy --schema=/app/prisma/schema.prisma
  su-exec node "$PRISMA_BIN" db seed
else
  echo "[entrypoint] No migrations → db push"
  su-exec node "$PRISMA_BIN" db push --schema=/app/prisma/schema.prisma
  su-exec node "$PRISMA_BIN" db seed
fi

echo "[entrypoint] Starting API..."

exec su-exec node node /app/srcs/server.js
# exec su-exec node node --watch --watch-path=/app/srcs /app/srcs/server.js
