FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache python3 make g++ curl bash

WORKDIR /app

# Copy package.json only
COPY package.json ./

# Clean install (will create fresh package-lock.json)
RUN npm install

# Copy source code
COPY . .

# Create directories
RUN mkdir -p logs

EXPOSE 5001

# Start app
CMD ["node", "src/server.js"]
