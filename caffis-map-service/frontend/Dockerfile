FROM node:18-alpine

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

EXPOSE 3001

# Start webpack dev server
CMD ["npx", "webpack", "serve", "--mode", "development", "--host", "0.0.0.0", "--port", "3001"]
