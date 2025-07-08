// caffis-map-service/backend/src/routes/mapRoutes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const redisService = require('../services/redisService');
const socketService = require('../services/socketService');
const logger = require('../utils/logger');

// Authentication middleware
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      userId: decoded.userId || decoded.id,
      email: decoded.email
    };
    
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Apply auth middleware to all routes
router.use(authMiddleware);

// Validation schemas
const locationSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  city: Joi.string().min(2).max(50).required(),
  isAvailable: Joi.boolean().default(true)
});

const userQuerySchema = Joi.object({
  city: Joi.string().min(2).max(50).required(),
  radius: Joi.number().min(100).max(10000).default(5000),
  availableOnly: Joi.boolean().default(true)
});

// ============================================
// LOCATION ENDPOINTS
// ============================================

// Update user location
router.put('/location', async (req, res) => {
  try {
    const { error, value } = locationSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details[0].message
      });
    }

    const { latitude, longitude, city, isAvailable } = value;
    const userId = req.user.userId;

    // Store location in Redis
    const locationData = {
      userId,
      latitude,
      longitude,
      city: city.toLowerCase(),
      isAvailable,
      timestamp: new Date().toISOString()
    };

    await redisService.set(`location:${userId}`, locationData, 300); // 5 minutes TTL

    // Add user to city users set
    await redisService.sAdd(`city_users:${city.toLowerCase()}`, userId);
    await redisService.expire(`city_users:${city.toLowerCase()}`, 300);

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: locationData
    });

    logger.info(`Location updated for user ${userId} in ${city}`);

  } catch (error) {
    logger.error('Error updating location:', error);
    res.status(500).json({
      error: 'Failed to update location',
      message: error.message
    });
  }
});

// Get user location
router.get('/location', async (req, res) => {
  try {
    const userId = req.user.userId;
    const location = await redisService.get(`location:${userId}`);

    if (!location) {
      return res.status(404).json({
        error: 'Location not found',
        message: 'No location data available for this user'
      });
    }

    res.json({
      success: true,
      data: location
    });

  } catch (error) {
    logger.error('Error getting location:', error);
    res.status(500).json({
      error: 'Failed to get location',
      message: error.message
    });
  }
});

// Delete user location
router.delete('/location', async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get current location to know which city to remove from
    const currentLocation = await redisService.get(`location:${userId}`);
    
    await redisService.del(`location:${userId}`);

    // Remove from city users if location existed
    if (currentLocation && currentLocation.city) {
      // Note: sRem would be needed for proper removal from set
      // For now, the TTL will handle cleanup
    }

    res.json({
      success: true,
      message: 'Location deleted successfully'
    });

    logger.info(`Location deleted for user ${userId}`);

  } catch (error) {
    logger.error('Error deleting location:', error);
    res.status(500).json({
      error: 'Failed to delete location',
      message: error.message
    });
  }
});

// ============================================
// USER DISCOVERY ENDPOINTS
// ============================================

// Get nearby users
router.get('/users/nearby', async (req, res) => {
  try {
    const { error, value } = userQuerySchema.validate(req.query);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details[0].message
      });
    }

    const { city, radius, availableOnly } = value;
    const currentUserId = req.user.userId;

    // Get all users in the city
    const cityUsers = await redisService.sMembers(`city_users:${city.toLowerCase()}`);
    
    const nearbyUsers = [];

    for (const userId of cityUsers) {
      if (userId === currentUserId) continue; // Skip current user

      const userLocation = await redisService.get(`location:${userId}`);
      
      if (!userLocation) continue;
      
      // Filter by availability if requested
      if (availableOnly && !userLocation.isAvailable) continue;

      // Add basic user info (in real app, you'd fetch from main API)
      nearbyUsers.push({
        userId: userLocation.userId,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        isAvailable: userLocation.isAvailable,
        timestamp: userLocation.timestamp,
        // Basic profile info (would come from main API)
        profile: {
          name: `User ${userId.slice(-4)}`,
          avatar: null
        }
      });
    }

    res.json({
      success: true,
      data: {
        users: nearbyUsers,
        count: nearbyUsers.length,
        city: city.toLowerCase(),
        radius,
        availableOnly
      }
    });

    logger.debug(`Found ${nearbyUsers.length} nearby users for ${currentUserId} in ${city}`);

  } catch (error) {
    logger.error('Error getting nearby users:', error);
    res.status(500).json({
      error: 'Failed to get nearby users',
      message: error.message
    });
  }
});

// Get user by ID
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user location
    const userLocation = await redisService.get(`location:${userId}`);
    
    if (!userLocation) {
      return res.status(404).json({
        error: 'User not found',
        message: 'No location data available for this user'
      });
    }

    // Get cached profile or basic info
    let userProfile = await redisService.get(`user_profile:${userId}`);
    
    if (!userProfile) {
      userProfile = {
        userId,
        name: `User ${userId.slice(-4)}`,
        avatar: null,
        bio: 'Coffee enthusiast',
        cached: false
      };
    }

    res.json({
      success: true,
      data: {
        location: userLocation,
        profile: userProfile
      }
    });

  } catch (error) {
    logger.error('Error getting user:', error);
    res.status(500).json({
      error: 'Failed to get user',
      message: error.message
    });
  }
});

// ============================================
// COFFEE SHOP ENDPOINTS
// ============================================

// Get coffee shops (mock data for now)
router.get('/coffee-shops', async (req, res) => {
  try {
    const { city, latitude, longitude } = req.query;

    if (!city) {
      return res.status(400).json({
        error: 'City parameter is required'
      });
    }

    // Check cache first
    let coffeeShops = await redisService.get(`coffee_shops:${city.toLowerCase()}`);

    if (!coffeeShops) {
      // Mock data - in real app, fetch from Google Places API or your database
      coffeeShops = [
        {
          id: 'shop_1',
          name: 'Caffè Centrale',
          address: 'Via Roma 123, Torino',
          latitude: 45.0703,
          longitude: 7.6869,
          rating: 4.5,
          priceLevel: 2,
          photos: [],
          openNow: true
        },
        {
          id: 'shop_2', 
          name: 'Torrefazione Giamaica',
          address: 'Via Garibaldi 45, Torino',
          latitude: 45.0728,
          longitude: 7.6854,
          rating: 4.7,
          priceLevel: 2,
          photos: [],
          openNow: true
        },
        {
          id: 'shop_3',
          name: 'Lavazza Flagship Store',
          address: 'Via Po 8, Torino',
          latitude: 45.0685,
          longitude: 7.6917,
          rating: 4.3,
          priceLevel: 3,
          photos: [],
          openNow: false
        }
      ];

      // Cache for 1 hour
      await redisService.set(`coffee_shops:${city.toLowerCase()}`, coffeeShops, 3600);
    }

    res.json({
      success: true,
      data: {
        coffeeShops,
        count: coffeeShops.length,
        city: city.toLowerCase()
      }
    });

  } catch (error) {
    logger.error('Error getting coffee shops:', error);
    res.status(500).json({
      error: 'Failed to get coffee shops',
      message: error.message
    });
  }
});

// ============================================
// STATISTICS ENDPOINTS
// ============================================

// Get service statistics
router.get('/stats', async (req, res) => {
  try {
    const connectedUsers = socketService.getConnectedUsersCount();
    const usersByCity = socketService.getConnectedUsersByCity();

    // Get total cached locations
    const locationKeys = await redisService.keys('location:*');
    const totalLocations = locationKeys.length;

    // Get city statistics
    const cityKeys = await redisService.keys('city_users:*');
    const cityStats = {};
    
    for (const cityKey of cityKeys) {
      const cityName = cityKey.replace('city_users:', '');
      const users = await redisService.sMembers(cityKey);
      cityStats[cityName] = users.length;
    }

    res.json({
      success: true,
      data: {
        connectedUsers,
        totalLocations,
        usersByCity,
        cityStats,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error getting stats:', error);
    res.status(500).json({
      error: 'Failed to get statistics',
      message: error.message
    });
  }
});

// ============================================
// INVITE ENDPOINTS
// ============================================

// Get user invites
router.get('/invites', async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get invite keys for this user
    const inviteKeys = await redisService.keys('invite:*');
    const userInvites = [];

    for (const key of inviteKeys) {
      const invite = await redisService.get(key);
      if (invite && (invite.fromUserId === userId || invite.toUserId === userId)) {
        userInvites.push(invite);
      }
    }

    // Sort by timestamp (newest first)
    userInvites.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      data: {
        invites: userInvites,
        count: userInvites.length
      }
    });

  } catch (error) {
    logger.error('Error getting invites:', error);
    res.status(500).json({
      error: 'Failed to get invites',
      message: error.message
    });
  }
});

// Get specific invite
router.get('/invites/:inviteId', async (req, res) => {
  try {
    const { inviteId } = req.params;
    const userId = req.user.userId;
    
    const invite = await redisService.get(`invite:${inviteId}`);
    
    if (!invite) {
      return res.status(404).json({
        error: 'Invite not found',
        message: 'Invite not found or expired'
      });
    }

    // Check if user is authorized to view this invite
    if (invite.fromUserId !== userId && invite.toUserId !== userId) {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'You are not authorized to view this invite'
      });
    }

    res.json({
      success: true,
      data: invite
    });

  } catch (error) {
    logger.error('Error getting invite:', error);
    res.status(500).json({
      error: 'Failed to get invite',
      message: error.message
    });
  }
});

module.exports = router;