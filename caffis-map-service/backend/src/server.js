// caffis-map-service/backend/src/server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import services and middleware
const redisService = require('./services/redisService');
const socketService = require('./services/socketService');
const authMiddleware = require('./middleware/authMiddleware');
const logger = require('./utils/logger');

// Import routes
const mapRoutes = require('./routes/mapRoutes');
const healthRoutes = require('./routes/healthRoutes');

const app = express();
const server = http.createServer(app);

// ============================================
// SOCKET.IO SETUP WITH CORS
// ============================================
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:3000",  // Main app frontend
      "http://localhost:3001",  // Map widget dev server
      "https://caffis.app",     // Production domain
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// ============================================
// MIDDLEWARE SETUP
// ============================================
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline styles for map
  crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:3001", 
    "https://caffis.app"
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later' }
});
app.use(limiter);

// ============================================
// ROUTES
// ============================================
app.use('/api/health', healthRoutes);
app.use('/api/map', authMiddleware, mapRoutes);

// ============================================
// SOCKET.IO CONNECTION HANDLING
// ============================================
socketService.initialize(io);

// ============================================
// ERROR HANDLING
// ============================================
app.use((err, req, res, next) => {
  logger.error('Server Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ============================================
// SERVER STARTUP
// ============================================
const PORT = process.env.PORT || 5001;

async function startServer() {
  try {
    // Initialize Redis connection
    await redisService.connect();
    logger.info('✅ Redis connected successfully');

    // Start the server
    server.listen(PORT, () => {
      logger.info(`🗺️  Caffis Map Service running on port ${PORT}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`📍 WebSocket endpoint: ws://localhost:${PORT}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

async function gracefulShutdown() {
  logger.info('🛑 Graceful shutdown initiated...');
  
  server.close(() => {
    logger.info('✅ HTTP server closed');
    redisService.disconnect();
    process.exit(0);
  });
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();