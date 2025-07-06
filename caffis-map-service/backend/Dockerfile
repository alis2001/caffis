# caffis-map-service/backend/Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    dumb-init \
    curl

# Create app user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S mapservice -u 1001

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy source code
COPY --chown=mapservice:nodejs . .

# Create logs directory
RUN mkdir -p logs && \
    chown mapservice:nodejs logs

# Switch to non-root user
USER mapservice

# Expose port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5001/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]