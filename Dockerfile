# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy and build frontend
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Only copy production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy build artifacts and server code
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server

# Expose port (Cloud Run sets PORT env)
EXPOSE 8080

# Start command
# We run initDb first to ensure schema is ready, then the server
CMD ["node", "server/initDb.js", "&&", "node", "server/index.js"]
