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
  origin: ['http://localhost:3000', 'http://localhost:3002','http://localhost:3003'],
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
