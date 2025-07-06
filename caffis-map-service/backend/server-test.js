const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

console.log('🗺️ Starting Caffis Map Service (Test Version)...');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5001;

// Try to load logger
let logger;
try {
  logger = require('./src/utils/logger');
  console.log('✅ Logger loaded successfully');
} catch (error) {
  console.error('❌ Logger failed to load:', error.message);
  logger = {
    info: console.log,
    error: console.error,
    warn: console.warn,
    debug: console.log
  };
}

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check route
app.get('/health', (req, res) => {
  logger.info('Health check requested');
  res.json({
    status: 'OK',
    service: 'caffis-map-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0-test'
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

// Try to load map routes
try {
  const mapRoutes = require('./src/routes/mapRoutes');
  app.use('/api/map', mapRoutes);
  console.log('✅ Map routes loaded successfully');
} catch (error) {
  console.error('❌ Map routes failed to load:', error.message);
  console.error('❌ Route error details:', error.stack);
}

// DO NOT LOAD SOCKET SERVICE - testing without it

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack });
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.path });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Caffis Map Service (Test) started successfully`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
