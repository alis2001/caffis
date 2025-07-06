// caffis-map-service/backend/src/services/socketService.js
const jwt = require('jsonwebtoken');
const redisService = require('./redisService');
const geoService = require('./geoService');
const logger = require('../utils/logger');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId mapping
  }

  initialize(io) {
    this.io = io;

    // FIXED: Authentication middleware for Socket.IO
    io.use(async (socket, next) => {
      try {
        // Get token from different possible sources
        let token = socket.handshake.auth?.token;
        
        if (!token && socket.handshake.headers?.authorization) {
          const authHeader = socket.handshake.headers.authorization;
          if (authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
          }
        }
        
        if (!token) {
          logger.warn('Socket connection attempted without token');
          return next(new Error('Authentication error: No token provided'));
        }

        // Verify JWT token (same secret as main app)
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Ensure we have a user ID
        socket.userId = decoded.id || decoded.userId || decoded.sub;
        socket.userToken = token;

        if (!socket.userId) {
          logger.error('Token decoded but no user ID found:', decoded);
          return next(new Error('Authentication error: Invalid token format'));
        }

        logger.info(`🔐 User ${socket.userId} authenticated via WebSocket`);
        next();
        
      } catch (error) {
        logger.error('Socket authentication error:', error.message);
        next(new Error('Authentication error: Invalid token'));
      }
    });

    // Handle connections
    io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    logger.info('🔌 Socket.IO service initialized successfully');
  }

  handleConnection(socket) {
    const userId = socket.userId;
    logger.info(`👋 User ${userId} connected to map service`);

    // Store connection
    this.connectedUsers.set(userId, socket.id);
    socket.join(`user:${userId}`);

    // ============================================
    // LOCATION EVENTS
    // ============================================

    socket.on('user:location:update', async (data) => {
      try {
        const { latitude, longitude, city } = data;
        
        // Validate coordinates
        if (!this.isValidCoordinate(latitude, longitude)) {
          socket.emit('error', { message: 'Invalid coordinates provided' });
          return;
        }

        // Update location in Redis
        await redisService.setUserLocation(userId, { latitude, longitude, city });

        // Join city room for real-time updates
        if (city) {
          socket.join(`city:${city.toLowerCase()}`);
        }

        // Broadcast to other users in the same city
        if (city) {
          socket.to(`city:${city.toLowerCase()}`).emit('user:location:new', {
            userId,
            latitude,
            longitude,
            timestamp: Date.now()
          });
        }

        // Send confirmation to user
        socket.emit('user:location:updated', {
          success: true,
          message: 'Location updated successfully'
        });

        logger.info(`📍 Location updated for user ${userId} in ${city}`);

      } catch (error) {
        logger.error('Error updating user location:', error);
        socket.emit('error', { message: 'Failed to update location' });
      }
    });

    // ============================================
    // AVAILABILITY EVENTS
    // ============================================

    socket.on('user:availability:toggle', async (data) => {
      try {
        const { isAvailable } = data;
        
        // Update availability in Redis
        await redisService.setUserAvailability(userId, isAvailable);

        // Broadcast availability change
        socket.broadcast.emit('user:availability:changed', {
          userId,
          isAvailable,
          timestamp: Date.now()
        });

        socket.emit('user:availability:updated', {
          success: true,
          isAvailable
        });

        logger.info(`🎯 Availability ${isAvailable ? 'enabled' : 'disabled'} for user ${userId}`);

      } catch (error) {
        logger.error('Error toggling availability:', error);
        socket.emit('error', { message: 'Failed to update availability' });
      }
    });

    // ============================================
    // COFFEE SHOP EVENTS
    // ============================================

    socket.on('coffee-shops:request', async (data) => {
      try {
        const { city, latitude, longitude, radius = 1000 } = data;
        
        // Get coffee shops (mock data for now)
        const coffeeShops = this.generateMockCoffeeShops(city);
        
        socket.emit('coffee-shops:received', {
          coffeeShops,
          city,
          timestamp: Date.now()
        });

        logger.info(`☕ Coffee shops sent to user ${userId} for ${city}`);

      } catch (error) {
        logger.error('Error getting coffee shops:', error);
        socket.emit('error', { message: 'Failed to get coffee shops' });
      }
    });

    // ============================================
    // INVITE EVENTS
    // ============================================

    socket.on('invite:send', async (data, callback) => {
      try {
        const { toUserId, message, coffeeShopId, meetingTime } = data;
        
        const invite = {
          id: `invite_${Date.now()}_${userId}`,
          fromUserId: userId,
          toUserId,
          message,
          coffeeShopId,
          meetingTime,
          timestamp: Date.now(),
          status: 'pending'
        };

        // Store invite in Redis
        await redisService.setInvite(invite.id, invite);

        // Send to target user if connected
        this.sendToUser(toUserId, 'invite:received', invite);

        // Confirm to sender
        if (callback) {
          callback({ success: true, invite });
        }

        logger.info(`💌 Invite sent from ${userId} to ${toUserId}`);

      } catch (error) {
        logger.error('Error sending invite:', error);
        if (callback) {
          callback({ success: false, error: error.message });
        }
      }
    });

    // ============================================
    // DISCONNECT HANDLING
    // ============================================

    socket.on('disconnect', async (reason) => {
      try {
        logger.info(`👋 User ${userId} disconnected: ${reason}`);
        
        // Remove from connected users
        this.connectedUsers.delete(userId);

        // Remove location from Redis
        await redisService.removeUserLocation(userId);

        // Broadcast to all rooms that user is offline
        socket.broadcast.emit('user:offline', {
          userId,
          timestamp: Date.now()
        });

      } catch (error) {
        logger.error('Error handling disconnect:', error);
      }
    });

    // ============================================
    // ERROR HANDLING
    // ============================================

    socket.on('error', (error) => {
      logger.error(`Socket error for user ${userId}:`, error);
    });

    // Send initial connection success
    socket.emit('connected', {
      success: true,
      userId,
      message: 'Connected to Caffis Map Service',
      timestamp: Date.now()
    });
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  isValidCoordinate(latitude, longitude) {
    return (
      typeof latitude === 'number' &&
      typeof longitude === 'number' &&
      latitude >= -90 && latitude <= 90 &&
      longitude >= -180 && longitude <= 180
    );
  }

  generateMockCoffeeShops(city) {
    // Mock coffee shops - you'll replace this with real data
    const baseCoords = city === 'torino' ? 
      { lat: 45.0704, lng: 7.6862 } : 
      { lat: 45.0704, lng: 7.6862 }; // Default to Turin

    return [
      {
        id: 'shop_1',
        name: 'Caffè Centrale',
        latitude: baseCoords.lat + (Math.random() - 0.5) * 0.01,
        longitude: baseCoords.lng + (Math.random() - 0.5) * 0.01,
        rating: 4.5,
        priceRange: '€€',
        features: ['wifi', 'outdoor', 'quiet']
      },
      {
        id: 'shop_2',
        name: 'La Tazza d\'Oro',
        latitude: baseCoords.lat + (Math.random() - 0.5) * 0.01,
        longitude: baseCoords.lng + (Math.random() - 0.5) * 0.01,
        rating: 4.3,
        priceRange: '€',
        features: ['coworking', 'fast-wifi', 'power-outlets']
      },
      {
        id: 'shop_3',
        name: 'Caffè Torino',
        latitude: baseCoords.lat + (Math.random() - 0.5) * 0.01,
        longitude: baseCoords.lng + (Math.random() - 0.5) * 0.01,
        rating: 4.7,
        priceRange: '€€€',
        features: ['historic', 'elegant', 'pastries']
      }
    ];
  }

  // Broadcast to all users in a city
  broadcastToCity(city, event, data) {
    if (this.io) {
      this.io.to(`city:${city.toLowerCase()}`).emit(event, data);
    }
  }

  // Send message to specific user
  sendToUser(userId, event, data) {
    if (this.io && this.connectedUsers.has(userId)) {
      this.io.to(`user:${userId}`).emit(event, data);
    }
  }

  // Get online users count
  getOnlineUsersCount() {
    return this.connectedUsers.size;
  }

  // Get users in a specific city room
  async getUsersInCityRoom(city) {
    if (!this.io) return [];
    
    try {
      const sockets = await this.io.in(`city:${city.toLowerCase()}`).fetchSockets();
      return sockets.map(socket => socket.userId).filter(Boolean);
    } catch (error) {
      logger.error('Error getting users in city room:', error);
      return [];
    }
  }
}

module.exports = new SocketService();
