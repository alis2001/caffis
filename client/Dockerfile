FROM node:18

WORKDIR /app

# Copy package files first (better Docker caching)
COPY package*.json ./

# Install dependencies AND next globally
RUN npm install && npm install -g next

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "run", "dev"]
