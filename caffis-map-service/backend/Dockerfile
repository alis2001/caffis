FROM node:18-alpine

RUN apk add --no-cache python3 make g++ curl

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install ALL dependencies including dev dependencies
RUN npm install

# Copy source code
COPY . .

EXPOSE 5001

# Use node directly for now
CMD ["node", "src/server.js"]
