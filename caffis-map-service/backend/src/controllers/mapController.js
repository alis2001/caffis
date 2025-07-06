// caffis-map-service/backend/src/controllers/mapController.js
const redisService = require('../services/redisService');
const locationService = require('../services/locationService');
const geoService = require('../services/geoService');
const logger = require('../utils/logger');

class MapController {
  // ============================================
  // USER LOCATION ENDPOINTS
  // ============================================

  /**
   * Update user's current location
   */
  async updateLocation(req, res) {
    try {
      const userId = req.user.id;
      const { latitude, longitude, city, isAvailable = true } = req.body;

      // Validate coordinates
      if (!geoService.isValidCoordinate(latitude, longitude)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid coordinates provided'
        });
      }

      // Get city name if not provided
      let actualCity = city;
      if (!actualCity) {
        actualCity = await locationService.getCityFromCoordinates(latitude, longitude);
      }

      // Update location in Redis
      await redisService.setUserLocation(userId, {
        latitude,
        longitude,
        city: actualCity,
        isAvailable,
        timestamp: Date.now()
      });

      logger.info(`Location updated for user ${userId} in ${actualCity}`);

      res.json({
        success: true,
        message: 'Location updated successfully',
        location: {
          latitude,
          longitude,
          city: actualCity,
          isAvailable
        }
      });

    } catch (error) {
      logger.error('Error updating location:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update location'
      });
    }
  }

  /**
   * Get user's current location
   */
  async getCurrentLocation(req, res) {
    try {
      const userId = req.user.id;
      const location = await redisService.getUserLocation(userId);

      if (!location) {
        return res.status(404).json({
          success: false,
          error: 'Location not found'
        });
      }

      res.json({
        success: true,
        location
      });

    } catch (error) {
      logger.error('Error getting current location:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get location'
      });
    }
  }

  /**
   * Toggle user availability for coffee meetups
   */
  async toggleAvailability(req, res) {
    try {
      const userId = req.user.id;
      const { isAvailable } = req.body;

      if (typeof isAvailable !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'isAvailable must be a boolean value'
        });
      }

      const currentLocation = await redisService.getUserLocation(userId);
      if (!currentLocation) {
        return res.status(404).json({
          success: false,
          error: 'No location found. Please update your location first.'
        });
      }

      // Update availability
      currentLocation.isAvailable = isAvailable;
      await redisService.setUserLocation(userId, currentLocation);

      logger.info(`Availability toggled for user ${userId}: ${isAvailable}`);

      res.json({
        success: true,
        message: 'Availability updated successfully',
        isAvailable
      });

    } catch (error) {
      logger.error('Error toggling availability:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update availability'
      });
    }
  }

  // ============================================
  // NEARBY USERS ENDPOINTS
  // ============================================

  /**
   * Get nearby users for coffee meetups
   */
  async getNearbyUsers(req, res) {
    try {
      const userId = req.user.id;
      const { 
        city, 
        radius = 5000, 
        availableOnly = true,
        includeProfiles = false 
      } = req.query;

      if (!city) {
        return res.status(400).json({
          success: false,
          error: 'City parameter is required'
        });
      }

      // Get users in the city
      let nearbyUsers = await redisService.getUsersInCity(city);
      
      // Remove current user from results
      nearbyUsers = nearbyUsers.filter(user => user.userId !== userId);

      // Filter by availability if requested
      if (availableOnly) {
        nearbyUsers = nearbyUsers.filter(user => user.isAvailable);
      }

      // Filter by radius if user location is available
      const userLocation = await redisService.getUserLocation(userId);
      if (userLocation && userLocation.latitude && userLocation.longitude) {
        nearbyUsers = nearbyUsers.filter(user => {
          const distance = geoService.calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            user.latitude,
            user.longitude
          );
          return distance <= parseInt(radius);
        });

        // Add distance to each user
        nearbyUsers = nearbyUsers.map(user => ({
          ...user,
          distance: geoService.calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            user.latitude,
            user.longitude
          )
        }));

        // Sort by distance
        nearbyUsers.sort((a, b) => a.distance - b.distance);
      }

      // Include user profiles if requested
      if (includeProfiles && req.headers.authorization) {
        const authToken = req.headers.authorization.split(' ')[1];
        
        for (let user of nearbyUsers) {
          const profile = await locationService.getUserProfile(user.userId, authToken);
          if (profile) {
            user.profile = profile;
          }
        }
      }

      res.json({
        success: true,
        users: nearbyUsers,
        count: nearbyUsers.length,
        filters: {
          city,
          radius: parseInt(radius),
          availableOnly,
          includeProfiles
        }
      });

    } catch (error) {
      logger.error('Error getting nearby users:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get nearby users'
      });
    }
  }

  /**
   * Get active users count by city
   */
  async getActiveUsersCount(req, res) {
    try {
      const { city } = req.params;
      
      const users = await redisService.getUsersInCity(city);
      const availableUsers = users.filter(user => user.isAvailable);

      res.json({
        success: true,
        city,
        totalUsers: users.length,
        availableUsers: availableUsers.length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error getting active users count:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get users count'
      });
    }
  }

  // ============================================
  // COFFEE SHOPS ENDPOINTS
  // ============================================

  /**
   * Get coffee shops in a city or near coordinates
   */
  async getCoffeeShops(req, res) {
    try {
      const { 
        city, 
        latitude, 
        longitude, 
        radius = 2000,
        useCache = true 
      } = req.query;

      let coffeeShops = [];

      if (city && useCache === 'true') {
        // Try to get from cache first
        coffeeShops = await redisService.getCoffeeShops(city);
      }

      if (!coffeeShops || coffeeShops.length === 0) {
        // Fetch from external service
        if (latitude && longitude) {
          coffeeShops = await locationService.getCoffeeShops(
            parseFloat(latitude), 
            parseFloat(longitude), 
            parseInt(radius)
          );
        } else if (city) {
          // Get city coordinates and then fetch coffee shops
          const cityCoords = await locationService.getCoordinatesFromCity(city);
          if (cityCoords) {
            coffeeShops = await locationService.getCoffeeShops(
              cityCoords.latitude,
              cityCoords.longitude,
              parseInt(radius)
            );
          }
        }

        // Cache the results if we have a city
        if (city && coffeeShops && coffeeShops.length > 0) {
          await redisService.setCoffeeShops(city, coffeeShops);
        }
      }

      // Filter by radius if user coordinates provided
      if (latitude && longitude && coffeeShops) {
        coffeeShops = coffeeShops.filter(shop => {
          const distance = geoService.calculateDistance(
            parseFloat(latitude),
            parseFloat(longitude),
            shop.latitude,
            shop.longitude
          );
          return distance <= parseInt(radius);
        });

        // Add distance to each shop
        coffeeShops = coffeeShops.map(shop => ({
          ...shop,
          distance: geoService.calculateDistance(
            parseFloat(latitude),
            parseFloat(longitude),
            shop.latitude,
            shop.longitude
          )
        }));

        // Sort by distance
        coffeeShops.sort((a, b) => a.distance - b.distance);
      }

      res.json({
        success: true,
        coffeeShops: coffeeShops || [],
        count: coffeeShops?.length || 0,
        filters: {
          city,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          radius: parseInt(radius)
        }
      });

    } catch (error) {
      logger.error('Error getting coffee shops:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get coffee shops'
      });
    }
  }

  /**
   * Get detailed information about a specific coffee shop
   */
  async getCoffeeShopDetails(req, res) {
    try {
      const { shopId } = req.params;
      
      const details = await locationService.getCoffeeShopDetails(shopId);
      
      if (!details) {
        return res.status(404).json({
          success: false,
          error: 'Coffee shop not found'
        });
      }

      res.json({
        success: true,
        shop: details
      });

    } catch (error) {
      logger.error('Error getting coffee shop details:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get coffee shop details'
      });
    }
  }

  // ============================================
  // INVITE ENDPOINTS (MAP-SPECIFIC)
  // ============================================

  /**
   * Send a coffee invite to another user
   */
  async sendCoffeeInvite(req, res) {
    try {
      const fromUserId = req.user.id;
      const { 
        toUserId, 
        message, 
        coffeeShopId, 
        proposedTime,
        location 
      } = req.body;

      if (!toUserId) {
        return res.status(400).json({
          success: false,
          error: 'Target user ID is required'
        });
      }

      // Check if target user is available and nearby
      const targetLocation = await redisService.getUserLocation(toUserId);
      if (!targetLocation || !targetLocation.isAvailable) {
        return res.status(400).json({
          success: false,
          error: 'Target user is not available for coffee meetups'
        });
      }

      const inviteData = {
        fromUserId,
        toUserId,
        message: message || 'Would you like to grab a coffee?',
        coffeeShopId,
        proposedTime,
        location,
        mapInvite: true,
        timestamp: new Date().toISOString()
      };

      // Send notification to main app
      if (req.headers.authorization) {
        const authToken = req.headers.authorization.split(' ')[1];
        await locationService.sendInviteNotification(
          fromUserId, 
          toUserId, 
          inviteData, 
          authToken
        );
      }

      logger.info(`Coffee invite sent from ${fromUserId} to ${toUserId}`);

      res.json({
        success: true,
        message: 'Coffee invite sent successfully',
        invite: inviteData
      });

    } catch (error) {
      logger.error('Error sending coffee invite:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send coffee invite'
      });
    }
  }

  // ============================================
  // UTILITY ENDPOINTS
  // ============================================

  /**
   * Get map service statistics
   */
  async getMapStats(req, res) {
    try {
      const stats = await redisService.getMapStatistics();
      const externalServices = await locationService.checkExternalServices();
      const config = locationService.getConfig();

      res.json({
        success: true,
        statistics: stats,
        externalServices,
        configuration: config,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error getting map statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get statistics'
      });
    }
  }

  /**
   * Clear user's location data
   */
  async clearLocation(req, res) {
    try {
      const userId = req.user.id;
      
      const currentLocation = await redisService.getUserLocation(userId);
      if (currentLocation && currentLocation.city) {
        await redisService.removeUserFromCity(userId, currentLocation.city);
      }
      
      await redisService.removeUserLocation(userId);

      logger.info(`Location cleared for user ${userId}`);

      res.json({
        success: true,
        message: 'Location cleared successfully'
      });

    } catch (error) {
      logger.error('Error clearing location:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to clear location'
      });
    }
  }
}

module.exports = new MapController();