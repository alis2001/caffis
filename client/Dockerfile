FROM node:18-alpine

WORKDIR /app

# Copy only package files first (for better caching)
COPY package*.json ./

# Install dependencies (this layer will be cached)
RUN npm ci --prefer-offline --no-audit

# Copy the rest of the application
COPY . .

# Build the Next.js app
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]