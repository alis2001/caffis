FROM node:18-alpine

RUN apk add --no-cache python3 make g++ curl openssl

WORKDIR /app

# Copy package files first
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies including dev dependencies for development
RUN npm install

# Generate Prisma client
RUN npx prisma generate --schema=./prisma/schema.prisma

# Copy source code
COPY . .

EXPOSE 5000 5555

# Use node directly instead of npm run dev to avoid nodemon issues
CMD ["node", "app.js"]
