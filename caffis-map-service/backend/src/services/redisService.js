// caffis-map-service/backend/src/services/redisService.js
const redis = require('redis');
const logger = require('../utils/logger');

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async init() {
    try {
      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        retryDelayOnClusterDown: 300
      };

      // Add password if provided
      if (process.env.REDIS_PASSWORD) {
        redisConfig.password = process.env.REDIS_PASSWORD;
      }

      // Create Redis client
      this.client = redis.createClient({
        socket: {
          host: redisConfig.host,
          port: redisConfig.port,
          connectTimeout: 5000,
          lazyConnect: true
        },
        password: redisConfig.password || undefined,
        database: process.env.REDIS_DB || 0
      });

      // Error handling
      this.client.on('error', (err) => {
        logger.error('Redis client error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis client connecting...');
      });

      this.client.on('ready', () => {
        logger.info('Redis client connected and ready');
        this.isConnected = true;
      });

      this.client.on('end', () => {
        logger.warn('Redis client connection ended');
        this.isConnected = false;
      });

      // Connect to Redis
      await this.client.connect();
      
      // Test the connection
      await this.ping();
      
      logger.info('Redis service initialized successfully');
      return this.client;

    } catch (error) {
      logger.error('Redis initialization failed:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async ping() {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }
    
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis ping failed:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async set(key, value, ttl = null) {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    try {
      const serializedValue = JSON.stringify(value);
      
      if (ttl) {
        await this.client.setEx(key, ttl, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
      
      logger.debug(`Redis SET: ${key} (TTL: ${ttl})`);
      return true;
    } catch (error) {
      logger.error(`Redis SET error for key ${key}:`, error);
      throw error;
    }
  }

  async get(key) {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    try {
      const value = await this.client.get(key);
      
      if (value === null) {
        return null;
      }
      
      const parsedValue = JSON.parse(value);
      logger.debug(`Redis GET: ${key}`);
      return parsedValue;
    } catch (error) {
      logger.error(`Redis GET error for key ${key}:`, error);
      throw error;
    }
  }

  async del(key) {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    try {
      const result = await this.client.del(key);
      logger.debug(`Redis DEL: ${key}`);
      return result;
    } catch (error) {
      logger.error(`Redis DEL error for key ${key}:`, error);
      throw error;
    }
  }

  async exists(key) {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Redis EXISTS error for key ${key}:`, error);
      throw error;
    }
  }

  async keys(pattern) {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    try {
      const keys = await this.client.keys(pattern);
      logger.debug(`Redis KEYS: ${pattern} (found ${keys.length})`);
      return keys;
    } catch (error) {
      logger.error(`Redis KEYS error for pattern ${pattern}:`, error);
      throw error;
    }
  }

  async hSet(hash, field, value) {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    try {
      const serializedValue = JSON.stringify(value);
      const result = await this.client.hSet(hash, field, serializedValue);
      logger.debug(`Redis HSET: ${hash}.${field}`);
      return result;
    } catch (error) {
      logger.error(`Redis HSET error for ${hash}.${field}:`, error);
      throw error;
    }
  }

  async hGet(hash, field) {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    try {
      const value = await this.client.hGet(hash, field);
      
      if (value === null) {
        return null;
      }
      
      const parsedValue = JSON.parse(value);
      logger.debug(`Redis HGET: ${hash}.${field}`);
      return parsedValue;
    } catch (error) {
      logger.error(`Redis HGET error for ${hash}.${field}:`, error);
      throw error;
    }
  }

  async hGetAll(hash) {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    try {
      const values = await this.client.hGetAll(hash);
      const parsedValues = {};
      
      for (const [field, value] of Object.entries(values)) {
        try {
          parsedValues[field] = JSON.parse(value);
        } catch {
          parsedValues[field] = value; // Keep as string if not JSON
        }
      }
      
      logger.debug(`Redis HGETALL: ${hash}`);
      return parsedValues;
    } catch (error) {
      logger.error(`Redis HGETALL error for ${hash}:`, error);
      throw error;
    }
  }

  async sAdd(set, ...members) {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    try {
      const serializedMembers = members.map(m => JSON.stringify(m));
      const result = await this.client.sAdd(set, serializedMembers);
      logger.debug(`Redis SADD: ${set} (${members.length} members)`);
      return result;
    } catch (error) {
      logger.error(`Redis SADD error for set ${set}:`, error);
      throw error;
    }
  }

  async sMembers(set) {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    try {
      const members = await this.client.sMembers(set);
      const parsedMembers = members.map(m => {
        try {
          return JSON.parse(m);
        } catch {
          return m; // Keep as string if not JSON
        }
      });
      
      logger.debug(`Redis SMEMBERS: ${set} (${members.length} members)`);
      return parsedMembers;
    } catch (error) {
      logger.error(`Redis SMEMBERS error for set ${set}:`, error);
      throw error;
    }
  }

  async expire(key, seconds) {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    try {
      const result = await this.client.expire(key, seconds);
      logger.debug(`Redis EXPIRE: ${key} (${seconds}s)`);
      return result;
    } catch (error) {
      logger.error(`Redis EXPIRE error for key ${key}:`, error);
      throw error;
    }
  }

  async getInfo() {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    try {
      const info = await this.client.info();
      return info;
    } catch (error) {
      logger.error('Redis INFO error:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      try {
        await this.client.quit();
        logger.info('Redis client disconnected');
      } catch (error) {
        logger.error('Redis disconnect error:', error);
      }
    }
    this.isConnected = false;
  }

  getClient() {
    return this.client;
  }

  isReady() {
    return this.isConnected;
  }
}

// Export singleton instance
module.exports = new RedisService();