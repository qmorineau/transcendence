#!/bin/sh
set -e

echo "[entrypoint] Starting API..."

exec su-exec node node /app/srcs/server.js
# exec su-exec node node --watch --watch-path=/app/srcs /app/srcs/server.js
