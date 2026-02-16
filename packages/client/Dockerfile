FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace config
COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./

# Copy package files
COPY packages/shared/package.json ./packages/shared/
COPY packages/client/package.json ./packages/client/

# Install dependencies
RUN npm install

# Copy source files
COPY packages/shared ./packages/shared
COPY packages/client ./packages/client

# Build shared package first, then client
RUN npm run build -w @cribbage/shared
RUN npm run build -w @cribbage/client

# Production stage with nginx
FROM nginx:alpine

# Copy built files to nginx
COPY --from=builder /app/packages/client/dist /usr/share/nginx/html

# Copy nginx config for SPA routing
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
