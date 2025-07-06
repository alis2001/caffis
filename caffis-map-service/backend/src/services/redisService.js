// caffis-map-service/backend/src/services/redisService.js
const redis = require('redis');
const logger = require('../utils/logger');

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      this.client = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        password: process.env.REDIS_PASSWORD || undefined,
        socket: {
          connectTimeout: 60000,
          lazyConnect: true,
          reconnectStrategy: (retries) => Math.min(retries * 50, 500)
        }
      });

      this.client.on('error', (err) => {
        logger.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('✅ Redis client connected');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        logger.info('✅ Redis client ready');
      });

      this.client.on('end', () => {
        logger.info('❌ Redis client disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
      return this.client;
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  disconnect() {
    if (this.client) {
      this.client.quit();
      this.isConnected = false;
      logger.info('✅ Redis connection closed gracefully');
    }
  }

  // ============================================
  // USER LOCATION METHODS
  // ============================================

  async setUserLocation(userId, latitude, longitude, city) {
    const locationData = {
      userId,
      latitude,
      longitude,
      city,
      timestamp: Date.now(),
      isAvailable: true
    };

    try {
      // Store user location with 5 minute TTL
      await this.client.setEx(
        `location:${userId}`, 
        300, // 5 minutes TTL
        JSON.stringify(locationData)
      );

      // Add user to city set with 5 minute TTL
      await this.client.setEx(`city:${city}:user:${userId}`, 300, '1');
      
      // Update city users list
      await this.client.sAdd(`city:${city}:users`, userId);
      await this.client.expire(`city:${city}:users`, 300);

      logger.info(`📍 Location updated for user ${userId} in ${city}`);
      return true;
    } catch (error) {
      logger.error('Error setting user location:', error);
      throw error;
    }
  }

  async getUserLocation(userId) {
    try {
      const locationStr = await this.client.get(`location:${userId}`);
      return locationStr ? JSON.parse(locationStr) : null;
    } catch (error) {
      logger.error('Error getting user location:', error);
      return null;
    }
  }

  async getUsersInCity(city, excludeUserId = null) {
    try {
      const userIds = await this.client.sMembers(`city:${city}:users`);
      const users = [];

      for (const userId of userIds) {
        if (excludeUserId && userId === excludeUserId) continue;
        
        const locationData = await this.getUserLocation(userId);
        if (locationData && locationData.isAvailable) {
          // Get user profile from main app (you'll implement this)
          const userProfile = await this.getUserProfile(userId);
          users.push({
            ...locationData,
            profile: userProfile
          });
        }
      }

      return users;
    } catch (error) {
      logger.error('Error getting users in city:', error);
      return [];
    }
  }

  async removeUserLocation(userId) {
    try {
      const locationData = await this.getUserLocation(userId);
      
      if (locationData && locationData.city) {
        // Remove from city sets
        await this.client.sRem(`city:${locationData.city}:users`, userId);
        await this.client.del(`city:${locationData.city}:user:${userId}`);
      }

      // Remove user location
      await this.client.del(`location:${userId}`);
      
      logger.info(`📍 Location removed for user ${userId}`);
      return true;
    } catch (error) {
      logger.error('Error removing user location:', error);
      throw error;
    }
  }

  // ============================================
  // USER AVAILABILITY METHODS
  // ============================================

  async setUserAvailability(userId, isAvailable) {
    try {
      const locationData = await this.getUserLocation(userId);
      if (locationData) {
        locationData.isAvailable = isAvailable;
        locationData.timestamp = Date.now();
        
        await this.client.setEx(
          `location:${userId}`, 
          300, 
          JSON.stringify(locationData)
        );
        
        logger.info(`🔄 Availability updated for user ${userId}: ${isAvailable}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Error setting user availability:', error);
      throw error;
    }
  }

  // ============================================
  // COFFEE SHOP METHODS
  // ============================================

  async setCoffeeShops(city, coffeeShops) {
    try {
      await this.client.setEx(
        `coffee_shops:${city}`, 
        3600, // 1 hour TTL
        JSON.stringify(coffeeShops)
      );
      
      logger.info(`☕ Coffee shops cached for ${city}: ${coffeeShops.length} shops`);
      return true;
    } catch (error) {
      logger.error('Error caching coffee shops:', error);
      throw error;
    }
  }

  async getCoffeeShops(city) {
    try {
      const shopsStr = await this.client.get(`coffee_shops:${city}`);
      return shopsStr ? JSON.parse(shopsStr) : null;
    } catch (error) {
      logger.error('Error getting coffee shops:', error);
      return null;
    }
  }

  // ============================================
  // CACHE METHODS
  // ============================================

  async cacheUserProfile(userId, profileData) {
    try {
      await this.client.setEx(
        `user_profile:${userId}`, 
        1800, // 30 minutes TTL
        JSON.stringify(profileData)
      );
      return true;
    } catch (error) {
      logger.error('Error caching user profile:', error);
      throw error;
    }
  }

  async getUserProfile(userId) {
    try {
      // First check cache
      const cachedProfile = await this.client.get(`user_profile:${userId}`);
      if (cachedProfile) {
        return JSON.parse(cachedProfile);
      }

      // If not in cache, fetch from main app API
      const profileData = await this.fetchUserProfileFromMainApp(userId);
      if (profileData) {
        await this.cacheUserProfile(userId, profileData);
        return profileData;
      }

      return null;
    } catch (error) {
      logger.error('Error getting user profile:', error);
      return null;
    }
  }

  async fetchUserProfileFromMainApp(userId) {
    try {
      // This will make API call to main app to get user profile
      // For now, return mock data - you'll implement this later
      return {
        id: userId,
        firstName: 'User',
        lastName: userId.slice(-2).toUpperCase(),
        username: `user${userId}`,
        profilePic: null,
        preferences: {
          coffeePersonality: 'balanced',
          socialEnergy: 'ambivert'
        }
      };
    } catch (error) {
      logger.error('Error fetching user profile from main app:', error);
      return null;
    }
  }

  // ============================================
  // INVITE METHODS
  // ============================================

  async storeInvite(inviteData) {
    try {
      const inviteId = `invite:${Date.now()}:${inviteData.fromUserId}`;
      await this.client.setEx(
        inviteId,
        1800, // 30 minutes TTL
        JSON.stringify(inviteData)
      );

      // Add to user's pending invites
      await this.client.sAdd(`user:${inviteData.toUserId}:pending_invites`, inviteId);
      await this.client.expire(`user:${inviteData.toUserId}:pending_invites`, 1800);

      return inviteId;
    } catch (error) {
      logger.error('Error storing invite:', error);
      throw error;
    }
  }

  async getUserPendingInvites(userId) {
    try {
      const inviteIds = await this.client.sMembers(`user:${userId}:pending_invites`);
      const invites = [];

      for (const inviteId of inviteIds) {
        const inviteStr = await this.client.get(inviteId);
        if (inviteStr) {
          invites.push(JSON.parse(inviteStr));
        }
      }

      return invites;
    } catch (error) {
      logger.error('Error getting pending invites:', error);
      return [];
    }
  }

  // ============================================
  // STATISTICS METHODS
  // ============================================

  async getMapStatistics() {
    try {
      const stats = {
        totalActiveUsers: 0,
        usersByCity: {},
        totalCoffeeShops: 0
      };

      // Get all location keys
      const locationKeys = await this.client.keys('location:*');
      stats.totalActiveUsers = locationKeys.length;

      // Count users by city
      const cityKeys = await this.client.keys('city:*:users');
      for (const cityKey of cityKeys) {
        const city = cityKey.split(':')[1];
        const userCount = await this.client.sCard(cityKey);
        stats.usersByCity[city] = userCount;
      }

      // Count coffee shops
      const shopKeys = await this.client.keys('coffee_shops:*');
      for (const shopKey of shopKeys) {
        const shopsStr = await this.client.get(shopKey);
        if (shopsStr) {
          const shops = JSON.parse(shopsStr);
          stats.totalCoffeeShops += shops.length;
        }
      }

      return stats;
    } catch (error) {
      logger.error('Error getting map statistics:', error);
      return { totalActiveUsers: 0, usersByCity: {}, totalCoffeeShops: 0 };
    }
  }
}

module.exports = new RedisService();