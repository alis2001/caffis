# caffis-platform/Makefile
# Development commands for Caffis platform

.PHONY: help dev prod stop clean logs build test lint

# Default target
help:
	@echo "🚀 Caffis Platform Development Commands"
	@echo ""
	@echo "Development:"
	@echo "  make dev          - Start development environment"
	@echo "  make dev-map      - Start only map service for development"
	@echo "  make dev-main     - Start only main app for development"
	@echo ""
	@echo "Production:"
	@echo "  make prod         - Start production environment"
	@echo "  make build        - Build all Docker images"
	@echo ""
	@echo "Management:"
	@echo "  make stop         - Stop all services"
	@echo "  make clean        - Clean up containers and volumes"
	@echo "  make logs         - Show logs for all services"
	@echo "  make logs-map     - Show logs for map service"
	@echo "  make logs-main    - Show logs for main app"
	@echo ""
	@echo "Utilities:"
	@echo "  make test         - Run all tests"
	@echo "  make lint         - Run linting"
	@echo "  make db-reset     - Reset all databases"
	@echo "  make cache-clear  - Clear Redis cache"

# Development environment
dev:
	@echo "🔧 Starting development environment..."
	docker-compose --profile development up -d
	@echo "✅ Development environment started!"
	@echo "📱 Main App: http://localhost:3000"
	@echo "🗺️ Map Service: http://localhost:3002"
	@echo "🔧 API: http://localhost:5000"
	@echo "📊 Map API: http://localhost:5001"

# Map service only
dev-map:
	@echo "🗺️ Starting map service for development..."
	docker-compose up -d map-backend map-redis map-frontend-dev
	@echo "✅ Map service started!"
	@echo "🗺️ Map Widget Dev: http://localhost:3002"
	@echo "📊 Map API: http://localhost:5001"

# Main app only
dev-main:
	@echo "📱 Starting main app for development..."
	docker-compose up -d main-backend main-postgres main-frontend
	@echo "✅ Main app started!"
	@echo "📱 Main App: http://localhost:3000"
	@echo "🔧 API: http://localhost:5000"

# Production environment
prod:
	@echo "🚀 Starting production environment..."
	docker-compose --profile production up -d
	@echo "✅ Production environment started!"
	@echo "🌐 Website: http://localhost"

# Build all images
build:
	@echo "🔨 Building all Docker images..."
	docker-compose build --parallel
	@echo "✅ All images built successfully!"

# Stop all services
stop:
	@echo "🛑 Stopping all services..."
	docker-compose down
	@echo "✅ All services stopped!"

# Clean up everything
clean:
	@echo "🧹 Cleaning up containers, networks, and volumes..."
	docker-compose down -v --remove-orphans
	docker system prune -f
	@echo "✅ Cleanup completed!"

# Show logs
logs:
	docker-compose logs -f

logs-map:
	docker-compose logs -f map-backend map-frontend-dev map-redis

logs-main:
	docker-compose logs -f main-backend main-frontend main-postgres

# Database operations
db-reset:
	@echo "🗄️ Resetting databases..."
	docker-compose down main-postgres map-redis
	docker volume rm caffis-main-postgres-data caffis-map-redis-data 2>/dev/null || true
	docker-compose up -d main-postgres map-redis
	@echo "✅ Databases reset!"

# Clear cache
cache-clear:
	@echo "🧹 Clearing Redis cache..."
	docker-compose exec map-redis redis-cli FLUSHALL
	@echo "✅ Cache cleared!"

# Testing
test:
	@echo "🧪 Running all tests..."
	cd caffis-main-app/server && npm test
	cd caffis-map-service/backend && npm test
	@echo "✅ All tests completed!"

# Linting
lint:
	@echo "🔍 Running linting..."
	cd caffis-main-app/client && npm run lint
	cd caffis-main-app/server && npm run lint
	cd caffis-map-service/backend && npm run lint
	cd caffis-map-service/frontend && npm run lint
	@echo "✅ Linting completed!"

# Health check
health:
	@echo "🏥 Checking service health..."
	@curl -f http://localhost:5000/health && echo "✅ Main API healthy"
	@curl -f http://localhost:5001/health && echo "✅ Map API healthy"
	@curl -f http://localhost:3000 && echo "✅ Frontend healthy"

# Database migration
migrate:
	@echo "🗄️ Running database migrations..."
	docker-compose exec main-backend npx prisma migrate deploy
	@echo "✅ Migrations completed!"

# Seed database
seed:
	@echo "🌱 Seeding database..."
	docker-compose exec main-backend npx prisma db seed
	@echo "✅ Database seeded!"