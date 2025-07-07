const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

console.log('🗺️ Starting Caffis Map Service...');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5001;

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// CORS
app.use(cors({
  origin: ["http://localhost:3000", "http://frontend:3000", "http://localhost:3001"],
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`🗺️ ${new Date().toISOString()} ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Try to load logger
let logger;
try {
  logger = require('./src/utils/logger');
  console.log('✅ Logger loaded successfully');
} catch (error) {
  console.error('❌ Logger failed to load:', error.message);
  // Fallback logger
  logger = {
    info: console.log,
    error: console.error,
    warn: console.warn,
    debug: console.log
  };
}

// Health check route (direct implementation)
app.get('/health', (req, res) => {
  logger.info('Health check requested');
  res.json({
    status: 'OK',
    service: 'caffis-map-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Try to load health routes
try {
  const healthRoutes = require('./src/routes/healthRoutes');
  app.use('/api/health', healthRoutes);
  console.log('✅ Health routes loaded successfully');
} catch (error) {
  console.error('❌ Health routes failed to load:', error.message);
}

// Basic map API endpoint (direct implementation)
app.get('/api/map/status', (req, res) => {
  res.json({
    message: 'Map service is operational',
    timestamp: new Date().toISOString(),
    services: {
      redis: 'not connected yet',
      socketio: 'not initialized yet'
    }
  });
});

// Try to load map routes
try {
  const mapRoutes = require('./src/routes/mapRoutes');
  app.use('/api/map', mapRoutes);
  console.log('✅ Map routes loaded successfully');
} catch (error) {
  console.error('❌ Map routes failed to load:', error.message);
  console.error('❌ Route error details:', error.stack);
}

const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://frontend:3000", "http://localhost:3001"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Try to initialize Socket.IO service
try {
  const socketService = require('./src/services/socketService');
  socketService.initialize(io);
  console.log('✅ Socket.IO service initialized');
} catch (error) {
  console.error('❌ Socket.IO service failed to initialize:', error.message);
}

// Try to connect to Redis
async function initializeRedis() {
  try {
    const redisService = require('./src/services/redisService');
    await redisService.connect();
    console.log('✅ Redis connected successfully');
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
  }
}

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack });
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Caffis Map Service started successfully`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  
  // Initialize Redis after server starts
  initializeRedis();
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`🛑 ${signal} received, shutting down gracefully`);
  
  server.close(() => {
    logger.info('🔌 HTTP server closed');
  });
  
  try {
    const redisService = require('./src/services/redisService');
    await redisService.disconnect();
    logger.info('📦 Redis disconnected');
  } catch (error) {
    console.error('❌ Redis disconnect error:', error.message);
  }
  
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = app;
