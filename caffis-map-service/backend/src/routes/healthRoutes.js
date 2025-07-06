// caffis-map-service/backend/src/routes/healthRoutes.js
const express = require('express');
const router = express.Router();
const redisService = require('../services/redisService');
const logger = require('../utils/logger');

// ============================================
// BASIC HEALTH CHECK
// ============================================
router.get('/', (req, res) => {
  res.json({
    status: 'OK',
    service: 'caffis-map-service',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// ============================================
// DETAILED HEALTH CHECK
// ============================================
router.get('/detailed', async (req, res) => {
  try {
    const healthCheck = {
      status: 'OK',
      service: 'caffis-map-service',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      checks: {
        redis: 'checking...',
        database: 'not_applicable',
        external_apis: 'checking...'
      }
    };

    // Check Redis connection
    try {
      if (redisService.isConnected) {
        await redisService.client.ping();
        healthCheck.checks.redis = 'OK';
      } else {
        healthCheck.checks.redis = 'DISCONNECTED';
        healthCheck.status = 'DEGRADED';
      }
    } catch (error) {
      healthCheck.checks.redis = 'ERROR';
      healthCheck.status = 'UNHEALTHY';
      logger.error('Redis health check failed:', error);
    }

    // Check external APIs (mock for now)
    try {
      // In future, check Mapbox API, main app API, etc.
      healthCheck.checks.external_apis = 'OK';
    } catch (error) {
      healthCheck.checks.external_apis = 'ERROR';
      healthCheck.status = 'DEGRADED';
    }

    const statusCode = healthCheck.status === 'OK' ? 200 : 
                      healthCheck.status === 'DEGRADED' ? 200 : 503;

    res.status(statusCode).json(healthCheck);
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(503).json({
      status: 'UNHEALTHY',
      service: 'caffis-map-service',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

// ============================================
// REDIS STATUS
// ============================================
router.get('/redis', async (req, res) => {
  try {
    if (!redisService.isConnected) {
      return res.status(503).json({
        status: 'DISCONNECTED',
        message: 'Redis client is not connected'
      });
    }

    const ping = await redisService.client.ping();
    const info = await redisService.client.info('memory');
    
    res.json({
      status: 'OK',
      ping: ping,
      connection: 'active',
      memory_info: info.split('\r\n').filter(line => 
        line.includes('used_memory') || line.includes('used_memory_human')
      )
    });
  } catch (error) {
    logger.error('Redis status check failed:', error);
    res.status(503).json({
      status: 'ERROR',
      error: error.message
    });
  }
});

// ============================================
// MAP SERVICE STATISTICS
// ============================================
router.get('/stats', async (req, res) => {
  try {
    const stats = await redisService.getMapStatistics();
    
    res.json({
      status: 'OK',
      statistics: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Stats check failed:', error);
    res.status(500).json({
      status: 'ERROR',
      error: 'Failed to retrieve statistics'
    });
  }
});

module.exports = router;