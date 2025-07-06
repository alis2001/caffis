// caffis-map-service/backend/src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * JWT Authentication Middleware for Map Service
 * Validates JWT tokens from the main Caffis application
 */
module.exports = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. Invalid token format.'
      });
    }

    // Verify JWT token (same secret as main app)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user info to request object
    req.user = {
      id: decoded.id || decoded.userId,
      ...decoded
    };

    // Log successful authentication
    logger.info(`🔐 User ${req.user.id} authenticated for map service`);

    next();
  } catch (error) {
    logger.error('JWT authentication error:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Access denied. Invalid token.'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Access denied. Token expired.'
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Authentication service error.'
      });
    }
  }
};