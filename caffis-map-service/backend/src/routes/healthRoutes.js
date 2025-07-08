// caffis-map-service/backend/src/routes/healthRoutes.js
const express = require('express');
const router = express.Router();
const redisService = require('../services/redisService');
const logger = require('../utils/logger');

// Health check endpoint
router.get('/', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'caffis-map-service',
      version: '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: {
        server: 'running'
      }
    };

    // Check Redis connection
    try {
      await redisService.ping();
      health.services.redis = 'connected';
    } catch (redisError) {
      logger.warn('Redis health check failed:', redisError.message);
      health.services.redis = 'disconnected';
      health.status = 'degraded';
    }

    // Check environment variables
    const requiredEnvVars = ['JWT_SECRET', 'REDIS_HOST', 'PORT'];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length > 0) {
      health.services.config = `missing: ${missingEnvVars.join(', ')}`;
      health.status = 'degraded';
    } else {
      health.services.config = 'valid';
    }

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);

  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      service: 'caffis-map-service'
    });
  }
});

// Detailed health check
router.get('/detailed', async (req, res) => {
  try {
    const detailed = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'caffis-map-service',
      version: '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      environment: process.env.NODE_ENV,
      platform: process.platform,
      nodeVersion: process.version,
      services: {
        server: 'running'
      },
      endpoints: {
        health: '/health',
        mapRoutes: '/api/map/*',
        socketIO: 'ws://localhost:' + (process.env.PORT || 5001)
      }
    };

    // Redis detailed check
    try {
      const redisInfo = await redisService.getInfo();
      detailed.services.redis = {
        status: 'connected',
        info: redisInfo
      };
    } catch (redisError) {
      detailed.services.redis = {
        status: 'disconnected',
        error: redisError.message
      };
      detailed.status = 'degraded';
    }

    const statusCode = detailed.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(detailed);

  } catch (error) {
    logger.error('Detailed health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      service: 'caffis-map-service'
    });
  }
});

// Ready check (for Kubernetes)
router.get('/ready', async (req, res) => {
  try {
    // Check if all critical services are ready
    await redisService.ping();
    
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      service: 'caffis-map-service'
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error.message,
      service: 'caffis-map-service'
    });
  }
});

// Live check (for Kubernetes)
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    service: 'caffis-map-service'
  });
});

module.exports = router;