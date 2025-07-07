// server/app.js - COMPLETE FIXED VERSION
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const inviteRoutes = require('./routes/inviteRoutes');
const requestRoutes = require('./routes/requestRoutes');
const userRoutes = require('./routes/userRoutes');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Create global Prisma instance
const prisma = new PrismaClient({
  log: ['warn', 'error'], // Reduce logging in production
});

// Graceful shutdown handler
const gracefulShutdown = async () => {
  console.log('🔄 Graceful shutdown initiated...');
  await prisma.$disconnect();
  console.log('✅ Database connections closed');
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Middleware
app.use(cors());
app.use(express.json());

// ============================================
// HEALTH CHECK ENDPOINT - ADD THIS FIRST
// ============================================
app.get('/health', async (req, res) => {
  try {
    // Test database connection
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

// ============================================
// API ROUTES
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/user', userRoutes);

// ============================================
// ERROR HANDLERS
// ============================================

// 404 handler - make sure this comes AFTER routes
app.use((req, res, next) => {
  res.status(404).json({ 
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
});

// Centralized error handling - comes LAST
app.use(errorHandler);

// ============================================
// START SERVER
// ============================================
app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
  console.log(`🗄️ Database: ${prisma ? 'Connected' : 'Disconnected'}`);
});

// Export for testing
module.exports = app;