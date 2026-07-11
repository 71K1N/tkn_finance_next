# syntax=docker/dockerfile:1

# Using bookworm-slim (glibc) rather than alpine for reliable arm/v7 (Raspberry Pi 3) support.
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* vars are inlined at build time. Default is same-origin "/api",
# meant to be routed to the backend by the nginx reverse proxy.
ARG NEXT_PUBLIC_API_URL=/api
ARG NEXT_PUBLIC_AUTH_TOKEN=1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_AUTH_TOKEN=$NEXT_PUBLIC_AUTH_TOKEN

RUN npm run build

FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
