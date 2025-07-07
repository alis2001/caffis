# server/Dockerfile - FINAL FIX with proper permissions

FROM node:18-alpine AS base

# Install system dependencies for Prisma and Alpine
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl \
    openssl \
    libc6-compat

WORKDIR /app

# ============================================
# DEVELOPMENT STAGE
# ============================================
FROM base AS development

# Create non-root user FIRST
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files as root, then change ownership
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies as root
RUN npm ci

# CRITICAL: Set environment variables for Prisma
ENV PRISMA_CLI_BINARY_TARGETS="linux-musl-openssl-3.0.x"
ENV PRISMA_CLIENT_ENGINE_TYPE="binary"

# Generate Prisma client as root
RUN npx prisma generate --schema=./prisma/schema.prisma

# Copy source code
COPY . .

# Create healthcheck script
RUN echo '#!/bin/sh\ncurl -f http://localhost:5000/health || exit 1' > /app/healthcheck.sh && \
    chmod +x /app/healthcheck.sh

# CRITICAL: Change ownership of ALL files to nodejs user AFTER everything is installed
RUN chown -R nodejs:nodejs /app

# Switch to non-root user for runtime
USER nodejs

EXPOSE 5000
EXPOSE 5555

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD /app/healthcheck.sh

CMD ["npm", "run", "dev"]

# ============================================
# PRODUCTION STAGE
# ============================================
FROM base AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files and Prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies as root
RUN npm ci

# CRITICAL: Set environment variables for Prisma
ENV PRISMA_CLI_BINARY_TARGETS="linux-musl-openssl-3.0.x"
ENV PRISMA_CLIENT_ENGINE_TYPE="binary"

# Generate Prisma client as root
RUN npx prisma generate --schema=./prisma/schema.prisma

# Remove dev dependencies
RUN npm prune --production

# Copy application code
COPY . .

# Create healthcheck script
RUN echo '#!/bin/sh\ncurl -f http://localhost:5000/health || exit 1' > /app/healthcheck.sh && \
    chmod +x /app/healthcheck.sh

# CRITICAL: Change ownership of ALL files to nodejs user AFTER everything is done
RUN chown -R nodejs:nodejs /app

# Switch to non-root user for runtime
USER nodejs

EXPOSE 5000
EXPOSE 5555

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD /app/healthcheck.sh

CMD ["node", "app.js"]