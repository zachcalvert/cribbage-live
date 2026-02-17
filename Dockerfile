# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/server/package*.json ./packages/server/
COPY packages/client/package*.json ./packages/client/

# Install dependencies
RUN npm ci

# Copy tsconfig and source code
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY packages/server ./packages/server
COPY packages/client ./packages/client

# Build shared package first
RUN npm run build -w @cribbage/shared

# Build client (static files)
RUN npm run build -w @cribbage/client

# Build server
RUN npm run build -w @cribbage/server

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/server/package*.json ./packages/server/

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built shared package
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

# Copy built server
COPY --from=builder /app/packages/server/dist ./packages/server/dist

# Copy built client to public directory (served by server)
COPY --from=builder /app/packages/client/dist ./packages/server/public

ENV NODE_ENV=production

EXPOSE 8080

CMD ["node", "packages/server/dist/index.js"]
