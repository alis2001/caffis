// caffis-map-service/backend/src/services/redisService.js
const Redis = require('redis');
const logger = require('../utils/logger');

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  // ============================================
  // CONNECTION MANAGEMENT
  // ============================================

  async connect() {
    try {
      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      };

      this.client = Redis.createClient(redisConfig);

      // Event listeners
      this.client.on('connect', () => {
        logger.info('🔌 Connecting to Redis...');
      });

      this.client.on('ready', () => {
        logger.info('✅ Redis connected and ready');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        logger.error('❌ Redis connection error:', err);
        this.isConnected = false;
      });

      this.client.on('end', () => {
        logger.warn('🔌 Redis connection closed');
        this.isConnected = false;
      });

      await this.client.connect();
      return this.client;
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      logger.info('🔌 Redis disconnected');
    }
  }

  // ============================================
  // LOCATION OPERATIONS
  // ============================================

  async setUserLocation(userId, locationData) {
    try {
      const key = `location:${userId}`;
      const data = {
        ...locationData,
        timestamp: Date.now(),
        userId
      };

      await this.client.setEx(key, 300, JSON.stringify(data)); // 5 min TTL
      logger.info(`📍 Location saved for user ${userId}`);
      return true;
    } catch (error) {
      logger.error('Error saving user location:', error);
      throw error;
    }
  }

  async getUserLocation(userId) {
    try {
      const key = `location:${userId}`;
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Error getting user location:', error);
      return null;
    }
  }

  async removeUserLocation(userId) {
    try {
      const key = `location:${userId}`;
      await this.client.del(key);
      logger.info(`🗑️ Location removed for user ${userId}`);
    } catch (error) {
      logger.error('Error removing user location:', error);
    }
  }

  // ============================================
  // CITY-BASED USER GROUPS
  // ============================================

  async addUserToCity(userId, cityName) {
    try {
      const key = `city:${cityName.toLowerCase()}`;
      await this.client.sAdd(key, userId);
      await this.client.expire(key, 300); // 5 min TTL
      logger.info(`🏙️ User ${userId} added to city ${cityName}`);
    } catch (error) {
      logger.error('Error adding user to city:', error);
    }
  }

  async removeUserFromCity(userId, cityName) {
    try {
      const key = `city:${cityName.toLowerCase()}`;
      await this.client.sRem(key, userId);
      logger.info(`🏙️ User ${userId} removed from city ${cityName}`);
    } catch (error) {
      logger.error('Error removing user from city:', error);
    }
  }

  async getUsersInCity(cityName) {
    try {
      const key = `city:${cityName.toLowerCase()}`;
      const userIds = await this.client.sMembers(key);
      
      // Get all user locations
      const locations = [];
      for (const userId of userIds) {
        const location = await this.getUserLocation(userId);
        if (location) {
          locations.push(location);
        }
      }

      return locations;
    } catch (error) {
      logger.error('Error getting users in city:', error);
      return [];
    }
  }

  // ============================================
  // COFFEE SHOP OPERATIONS
  // ============================================

  async setCoffeeShops(cityName, shopsData) {
    try {
      const key = `coffee_shops:${cityName.toLowerCase()}`;
      await this.client.setEx(key, 3600, JSON.stringify(shopsData)); // 1 hour TTL
      logger.info(`☕ Coffee shops cached for ${cityName}`);
    } catch (error) {
      logger.error('Error caching coffee shops:', error);
    }
  }

  async getCoffeeShops(cityName) {
    try {
      const key = `coffee_shops:${cityName.toLowerCase()}`;
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Error getting coffee shops:', error);
      return null;
    }
  }

  // ============================================
  // USER PROFILE CACHE
  // ============================================

  async setUserProfile(userId, profileData) {
    try {
      const key = `user_profile:${userId}`;
      await this.client.setEx(key, 1800, JSON.stringify(profileData)); // 30 min TTL
      logger.info(`👤 Profile cached for user ${userId}`);
    } catch (error) {
      logger.error('Error caching user profile:', error);
    }
  }

  async getUserProfile(userId) {
    try {
      const key = `user_profile:${userId}`;
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Error getting user profile:', error);
      return null;
    }
  }

  // ============================================
  // ADDITIONAL METHODS FOR SOCKET SERVICE
  // ============================================

  async setUserAvailability(userId, isAvailable) {
    try {
      const key = `availability:${userId}`;
      const data = {
        userId,
        isAvailable,
        timestamp: Date.now()
      };
      await this.client.setEx(key, 300, JSON.stringify(data)); // 5 min TTL
      logger.info(`🎯 Availability set for user ${userId}: ${isAvailable}`);
    } catch (error) {
      logger.error('Error setting user availability:', error);
    }
  }

  async getUserAvailability(userId) {
    try {
      const key = `availability:${userId}`;
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Error getting user availability:', error);
      return null;
    }
  }

  async setInvite(inviteId, inviteData) {
    try {
      const key = `invite:${inviteId}`;
      await this.client.setEx(key, 3600, JSON.stringify(inviteData)); // 1 hour TTL
      logger.info(`💌 Invite stored: ${inviteId}`);
    } catch (error) {
      logger.error('Error storing invite:', error);
    }
  }

  async getInvite(inviteId) {
    try {
      const key = `invite:${inviteId}`;
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Error getting invite:', error);
      return null;
    }
  }

  async getMapStatistics() {
    try {
      const keys = await this.client.keys('*');
      const locationKeys = keys.filter(key => key.startsWith('location:'));
      const availabilityKeys = keys.filter(key => key.startsWith('availability:'));
      const inviteKeys = keys.filter(key => key.startsWith('invite:'));

      return {
        totalKeys: keys.length,
        activeUsers: locationKeys.length,
        availableUsers: availabilityKeys.length,
        pendingInvites: inviteKeys.length,
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error('Error getting map statistics:', error);
      return {
        totalKeys: 0,
        activeUsers: 0,
        availableUsers: 0,
        pendingInvites: 0,
        timestamp: Date.now()
      };
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  async getConnectionStatus() {
    return {
      connected: this.isConnected,
      client: !!this.client
    };
  }

  async flushAll() {
    try {
      await this.client.flushAll();
      logger.info('🧹 Redis cache cleared');
    } catch (error) {
      logger.error('Error clearing cache:', error);
    }
  }

  async getKeys(pattern = '*') {
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      logger.error('Error getting keys:', error);
      return [];
    }
  }
}

// Create singleton instance
const redisService = new RedisService();

module.exports = redisService;