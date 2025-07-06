# caffis-map-service/backend/Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Create logs directory
RUN mkdir -p logs

# Copy package files first for better Docker caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S caffis -u 1001 -G nodejs

# Change ownership of the app directory
RUN chown -R caffis:nodejs /app

# Switch to non-root user
USER caffis

# Expose port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5001/api/health', (res) => { \
    if (res.statusCode === 200) { process.exit(0) } else { process.exit(1) } \
  }).on('error', () => process.exit(1))"

# Start the application
CMD ["node", "src/server.js"]