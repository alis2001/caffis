FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --prefer-offline --no-audit

# Copy all source files
COPY . .

# Set environment variables
ENV NEXT_PUBLIC_API_URL=http://localhost:5000
ENV NEXT_PUBLIC_MAP_SERVICE_URL=http://localhost:5001
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application - this time without || true so we see errors
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
