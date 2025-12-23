# Multi-stage build for production

# Stage 1: Build frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Build backend
FROM node:18-alpine AS backend-builder
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm ci --production

# Stage 3: Production image
FROM node:18-alpine
WORKDIR /app

# Copy backend
COPY --from=backend-builder /app/server ./server
COPY server/schema.sql ./server/

# Copy frontend build
COPY --from=frontend-builder /app/build ./public

# Install serve for static files
RUN npm install -g serve

# Expose ports
EXPOSE 4000 3000

# Start script
COPY docker-start.sh .
RUN chmod +x docker-start.sh

CMD ["./docker-start.sh"]

