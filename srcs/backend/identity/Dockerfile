# 1) Build layer
FROM node:24-alpine AS build
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat


COPY package*.json ./

# Create/verify lockfile and install deps
RUN npm install --package-lock-only
RUN npm ci

RUN mkdir -p /app/public/avatars

COPY avatars/default_pp.jpg /app/public/avatars/default_pp.jpeg
COPY avatars/terminator.webp /app/public/avatars/terminator.webp
COPY avatars/deleted.png /app/public/avatars/deleted.png
COPY avatars/jconnor.webp /app/public/avatars/jconnor.webp
COPY avatars/qmorinea.jpg /app/public/avatars/qmorinea.jpeg
COPY avatars/lderidde.jpg /app/public/avatars/lderidde.jpeg
COPY avatars/nalebrun.jpeg /app/public/avatars/nalebrun.jpeg

COPY prisma ./prisma
COPY srcs ./srcs

# Prisma generate (explicit schema path so it never "can't find" it)
ENV DATABASE_URL="file:/app/data/identity.sqlite"
RUN npx prisma generate --schema=prisma/schema.prisma

# 2) Runtime
FROM node:24-alpine
# WORKDIR /app

RUN apk add --no-cache openssl libc6-compat su-exec sqlite curl
RUN mkdir -p /app/data
RUN mkdir -p /app/srcs
RUN mkdir -p /app/public/avatars

COPY --from=build --chown=node:node /app/node_modules /app/node_modules
COPY --from=build --chown=node:node /app/prisma /app/prisma
COPY --from=build --chown=node:node /app/public/avatars /app/public/avatars
COPY --from=build --chown=node:node /app/srcs /app/srcs
COPY --chown=node:node package*.json /app/
COPY --chown=node:node tools/entrypoint.sh ./entrypoint.sh

RUN chmod +x ./entrypoint.sh

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4242
ENV DATABASE_URL="file:/app/data/identity.sqlite"

USER root
EXPOSE 3000
ENTRYPOINT ["./entrypoint.sh"]
