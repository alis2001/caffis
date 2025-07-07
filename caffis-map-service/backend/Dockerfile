# caffis-map-service/backend/Dockerfile - Fixed

FROM node:18-alpine AS base

# Install system dependencies including curl for health checks
RUN apk add --no-cache \
    curl \
    git \
    python3 \
    make \
    g++

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mapservice -u 1001

# ============================================
# DEVELOPMENT STAGE
# ============================================
FROM base AS development

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy source code
COPY --chown=mapservice:nodejs . .

# Switch to non-root user
USER mapservice

EXPOSE 5001

# Health check for development
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5001/health || exit 1

# Use the npm start script which runs minimal-server.js
CMD ["npm", "start"]

# ============================================
# PRODUCTION STAGE
# ============================================
FROM base AS production

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY --chown=mapservice:nodejs . .

# Switch to non-root user
USER mapservice

EXPOSE 5001

# Health check for production
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5001/health || exit 1

# Use the npm start script which runs minimal-server.js
CMD ["npm", "start"]