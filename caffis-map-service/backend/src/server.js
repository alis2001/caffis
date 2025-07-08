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
const logger = require('./utils/logger');

// Import routes
const mapRoutes = require('./routes/mapRoutes');
const healthRoutes = require('./routes/healthRoutes');

const app = express();
const server = http.createServer(app);

// CORS configuration for Socket.IO
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  }
});

const PORT = process.env.PORT || 5001;

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// CORS
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:3000",
    "http://localhost:3002",
    process.env.CORS_ORIGIN || "http://localhost:3000"
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Initialize Redis connection
redisService.init().then(() => {
  logger.info('Redis connection established');
}).catch(err => {
  logger.error('Redis connection failed:', err);
});

// Initialize Socket.IO service
socketService.init(io);

// Routes (health routes don't need auth)
app.use('/health', healthRoutes);
app.use('/api/map', mapRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Caffis Map Service',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`, { 
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    method: req.method,
    url: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await redisService.disconnect();
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  logger.info(`Map service backend running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  logger.info(`Redis host: ${process.env.REDIS_HOST}`);
  logger.info(`Frontend URL: ${process.env.FRONTEND_URL}`);
});