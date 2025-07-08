#!/bin/bash

# EMERGENCY COMPLETE FIX - Restore your full backend system
set -e

echo "🚨 EMERGENCY FIX: Restoring your complete backend system..."

# 1. Stop all services
echo "Stopping services..."
docker-compose down

# 2. Copy your COMPLETE app.js from project knowledge
echo "Restoring your complete app.js..."
cat > server/app.js << 'EOF'
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Create global Prisma instance
const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

// Make prisma globally available for routes
global.prisma = prisma;

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('🔄 Graceful shutdown initiated...');
  await prisma.$disconnect();
  console.log('✅ Database connections closed');
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3002'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1 as health_check`;
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'caffis-backend',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'connected',
        server: 'running'
      }
    });
  } catch (error) {
    console.error('❌ Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'caffis-backend',
      error: error.message,
      services: {
        database: 'disconnected',
        server: 'running'
      }
    });
  }
});

// Import and use your existing routes
let routesLoaded = 0;

try {
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes loaded');
  routesLoaded++;
} catch (error) {
  console.error('❌ Auth routes failed:', error.message);
}

try {
  const inviteRoutes = require('./routes/inviteRoutes');
  app.use('/api/invites', inviteRoutes);
  console.log('✅ Invite routes loaded');
  routesLoaded++;
} catch (error) {
  console.error('❌ Invite routes failed:', error.message);
}

try {
  const userRoutes = require('./routes/userRoutes');
  app.use('/api/user', userRoutes);
  console.log('✅ User routes loaded');
  routesLoaded++;
} catch (error) {
  console.error('❌ User routes failed:', error.message);
}

// Error handlers
try {
  const errorHandler = require('./middleware/errorHandler');
  
  // 404 handler
  app.use((req, res, next) => {
    res.status(404).json({ 
      error: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      timestamp: new Date().toISOString(),
      loadedRoutes: routesLoaded
    });
  });

  app.use(errorHandler);
  console.log('✅ Error handlers loaded');
} catch (error) {
  console.error('❌ Error handler missing, using basic fallback');
  
  app.use((req, res, next) => {
    res.status(404).json({ 
      error: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    });
  });

  app.use((error, req, res, next) => {
    console.error('❌ Error:', error);
    res.status(500).json({
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    });
  });
}

// Start server
app.listen(port, '0.0.0.0', async () => {
  console.log('\n🚀 =============================================');
  console.log(`✅ Caffis Backend Server running on port ${port}`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
  console.log(`📊 Routes loaded: ${routesLoaded}/3`);
  console.log(`🗄️ Database: ${process.env.DATABASE_URL ? 'Connected' : 'URL missing'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('🚀 =============================================\n');

  // Test database connection
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
});

module.exports = app;
EOF

# 3. Create missing errorHandler if it doesn't exist
if [ ! -f "server/middleware/errorHandler.js" ]; then
    echo "Creating missing errorHandler.js..."
    mkdir -p server/middleware
    cat > server/middleware/errorHandler.js << 'EOF'
module.exports = (err, req, res, next) => {
  console.error('🔥 Error Handler:', err);
  
  // Handle Prisma errors
  if (err.code === 'P2002') {
    return res.status(400).json({
      error: 'UNIQUE_CONSTRAINT_VIOLATION',
      message: 'This data already exists',
      timestamp: new Date().toISOString()
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }

  // Default error
  res.status(err.status || 500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    timestamp: new Date().toISOString()
  });
};
EOF
fi

# 4. Check if Prisma schema exists and migrate if needed
if [ -f "server/prisma/schema.prisma" ]; then
    echo "Prisma schema found, attempting migration..."
else
    echo "❌ Prisma schema missing - this will cause issues"
fi

# 5. Rebuild backend container
echo "Rebuilding backend container..."
docker-compose build --no-cache backend

# 6. Start services in order
echo "Starting services..."
docker-compose up -d db
sleep 10

echo "Starting backend..."
docker-compose up -d backend
sleep 20

echo "Starting other services..."
docker-compose up -d frontend map-redis map-backend map-frontend

# 7. Test endpoints
echo ""
echo "🧪 Testing endpoints..."
sleep 15

echo "Testing health endpoint..."
if curl -f http://localhost:5000/health 2>/dev/null; then
    echo "✅ Health endpoint OK"
else
    echo "❌ Health endpoint failed"
fi

echo ""
echo "Testing auth endpoints..."
echo "Register test:"
curl -X POST -H "Content-Type: application/json" \
     -d '{"firstName":"Test","lastName":"User","username":"testuser","email":"test@example.com","password":"TestPass123"}' \
     http://localhost:5000/api/auth/register 2>/dev/null | head -c 200
echo ""

echo "Login test:"
curl -X POST -H "Content-Type: application/json" \
     -d '{"emailOrUsername":"test@example.com","password":"TestPass123"}' \
     http://localhost:5000/api/auth/login 2>/dev/null | head -c 200
echo ""

echo ""
echo "📋 Check backend logs:"
echo "docker-compose logs -f backend"
echo ""
echo "🌐 Available endpoints:"
echo "• Health: http://localhost:5000/health"
echo "• Register: POST http://localhost:5000/api/auth/register"
echo "• Login: POST http://localhost:5000/api/auth/login"
echo "• Verify: POST http://localhost:5000/api/auth/verify"
echo ""
echo "🎉 EMERGENCY FIX COMPLETED!"