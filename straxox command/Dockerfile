# ─── Stage 1: Build Frontend (Vite) ──────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ─── Stage 2: Build Backend (TypeScript) ─────────────────────────────────────
FROM node:20-alpine AS backend-builder

WORKDIR /app/server

COPY server/package*.json ./
RUN npm ci

COPY server/ .
RUN npx prisma generate
RUN npm run build

# ─── Stage 3: Production Runtime ─────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Install only production dependencies
COPY server/package*.json ./
RUN npm ci --omit=dev

# Copy built backend
COPY --from=backend-builder /app/server/dist ./dist
COPY --from=backend-builder /app/server/node_modules/.prisma ./node_modules/.prisma
COPY --from=backend-builder /app/server/prisma ./prisma

# Run DB migrations on startup then launch server
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
