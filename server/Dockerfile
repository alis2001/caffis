FROM node:18

WORKDIR /app

# Copy package files first (better Docker caching)
COPY package*.json ./

# Install dependencies AND nodemon globally
RUN npm install && npm install -g nodemon

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 5000

# Start command
CMD ["npm", "run", "dev"]
