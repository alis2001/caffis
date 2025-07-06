// caffis-map-service/backend/src/routes/mapRoutes.js
const express = require('express');
const router = express.Router();
const redisService = require('../services/redisService');
const geoService = require('../services/geoService');
const logger = require('../utils/logger');

// ============================================
// GET USER'S CURRENT LOCATION
// ============================================
router.get('/location', async (req, res) => {
  try {
    const userId = req.user.id;
    const location = await redisService.getUserLocation(userId);
    
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    res.json({
      success: true,
      location
    });
  } catch (error) {
    logger.error('Error getting user location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get location'
    });
  }
});

// ============================================
// GET NEARBY USERS
// ============================================
router.get('/users/nearby', async (req, res) => {
  try {
    const userId = req.user.id;
    const { city, radius = 5000 } = req.query; // radius in meters

    if (!city) {
      return res.status(400).json({
        success: false,
        message: 'City parameter is required'
      });
    }

    const nearbyUsers = await redisService.getUsersInCity(city, userId);
    
    // Filter by radius if user location is available
    const userLocation = await redisService.getUserLocation(userId);
    let filteredUsers = nearbyUsers;

    if (userLocation && userLocation.latitude && userLocation.longitude) {
      filteredUsers = nearbyUsers.filter(user => {
        const distance = geoService.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          user.latitude,
          user.longitude
        );
        return distance <= radius;
      });
    }

    res.json({
      success: true,
      users: filteredUsers,
      count: filteredUsers.length,
      radius: parseInt(radius)
    });
  } catch (error) {
    logger.error('Error getting nearby users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get nearby users'
    });
  }
});

// ============================================
// GET COFFEE SHOPS IN CITY
// ============================================
router.get('/coffee-shops/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const { latitude, longitude, radius = 2000 } = req.query;

    let coffeeShops = await redisService.getCoffeeShops(city);

    if (!coffeeShops) {
      // Generate mock data for now
      coffeeShops = [
        {
          id: 'shop_1',
          name: 'Caffè Centrale',
          latitude: 45.0704,
          longitude: 7.6862,
          rating: 4.5,
          priceRange: '€€',
          features: ['wifi', 'outdoor', 'quiet'],
          address: 'Via Roma 1, Torino',
          openHours: '07:00-19:00',
          phone: '+39 011 123456'
        },
        {
          id: 'shop_2',
          name: 'La Tazza d\'Oro',
          latitude: 45.0734,
          longitude: 7.6831,
          rating: 4.3,
          priceRange: '€',
          features: ['coworking', 'fast-wifi', 'power-outlets'],
          address: 'Via Garibaldi 15, Torino',
          openHours: '06:30-20:00',
          phone: '+39 011 789012'
        }
      ];

      await redisService.setCoffeeShops(city, coffeeShops);
    }

    // Filter by radius if user coordinates provided
    if (latitude && longitude) {
      coffeeShops = coffeeShops.filter(shop => {
        const distance = geoService.calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          shop.latitude,
          shop.longitude
        );
        return distance <= radius;
      });
    }

    res.json({
      success: true,
      city,
      shops: coffeeShops,
      count: coffeeShops.length
    });
  } catch (error) {
    logger.error('Error getting coffee shops:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get coffee shops'
    });
  }
});

// ============================================
// GET MAP STATISTICS
// ============================================
router.get('/stats', async (req, res) => {
  try {
    const stats = await redisService.getMapStatistics();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Error getting map statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics'
    });
  }
});

// ============================================
// GET USER'S PENDING INVITES
// ============================================
router.get('/invites/pending', async (req, res) => {
  try {
    const userId = req.user.id;
    const pendingInvites = await redisService.getUserPendingInvites(userId);
    
    res.json({
      success: true,
      invites: pendingInvites,
      count: pendingInvites.length
    });
  } catch (error) {
    logger.error('Error getting pending invites:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pending invites'
    });
  }
});

// ============================================
// UPDATE USER AVAILABILITY
// ============================================
router.post('/availability', async (req, res) => {
  try {
    const userId = req.user.id;
    const { isAvailable } = req.body;

    if (typeof isAvailable !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isAvailable must be a boolean'
      });
    }

    const success = await redisService.setUserAvailability(userId, isAvailable);

    if (success) {
      res.json({
        success: true,
        isAvailable,
        message: isAvailable ? 
          'You are now available for coffee connections!' : 
          'You are now hidden from other users'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'User location not found. Please update your location first.'
      });
    }
  } catch (error) {
    logger.error('Error updating availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update availability'
    });
  }
});

// ============================================
// SEARCH USERS BY PREFERENCES
// ============================================
router.post('/users/search', async (req, res) => {
  try {
    const userId = req.user.id;
    const { city, preferences = {}, radius = 5000 } = req.body;

    if (!city) {
      return res.status(400).json({
        success: false,
        message: 'City is required'
      });
    }

    const nearbyUsers = await redisService.getUsersInCity(city, userId);
    
    // Filter by preferences if provided
    let matchedUsers = nearbyUsers;

    if (Object.keys(preferences).length > 0) {
      matchedUsers = nearbyUsers.filter(user => {
        if (!user.profile || !user.profile.preferences) return false;

        // Simple preference matching logic
        let matchScore = 0;
        const totalPreferences = Object.keys(preferences).length;

        for (const [key, value] of Object.entries(preferences)) {
          if (user.profile.preferences[key] === value) {
            matchScore++;
          }
        }

        // Return users with at least 50% preference match
        return (matchScore / totalPreferences) >= 0.5;
      });
    }

    res.json({
      success: true,
      users: matchedUsers,
      count: matchedUsers.length,
      searchCriteria: {
        city,
        preferences,
        radius
      }
    });
  } catch (error) {
    logger.error('Error searching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search users'
    });
  }
});

module.exports = router;