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

    // Authentication middleware for Socket.IO
    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        // Verify JWT token (same secret as main app)
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id || decoded.userId;
        socket.userToken = token;

        logger.info(`🔐 User ${socket.userId} authenticated via WebSocket`);
        next();
      } catch (error) {
        logger.error('Socket authentication error:', error);
        next(new Error('Authentication error: Invalid token'));
      }
    });

    // Handle connections
    io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    logger.info('🔌 Socket.IO service initialized');
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
        await redisService.setUserLocation(userId, latitude, longitude, city);

        // Join city room for real-time updates
        socket.join(`city:${city}`);

        // Broadcast to other users in the same city
        socket.to(`city:${city}`).emit('user:location:new', {
          userId,
          latitude,
          longitude,
          timestamp: Date.now()
        });

        // Send confirmation to user
        socket.emit('user:location:updated', {
          success: true,
          message: 'Location updated successfully'
        });

        // Get nearby users and send to client
        const nearbyUsers = await redisService.getUsersInCity(city, userId);
        socket.emit('users:nearby', nearbyUsers);

        logger.info(`📍 Location updated for user ${userId} in ${city}`);
      } catch (error) {
        logger.error('Error updating user location:', error);
        socket.emit('error', { message: 'Failed to update location' });
      }
    });

    socket.on('user:availability:toggle', async (data) => {
      try {
        const { isAvailable } = data;
        
        // Update availability in Redis
        await redisService.setUserAvailability(userId, isAvailable);

        // Get user location to determine city
        const locationData = await redisService.getUserLocation(userId);
        if (locationData && locationData.city) {
          // Broadcast availability change to city
          socket.to(`city:${locationData.city}`).emit('user:availability:changed', {
            userId,
            isAvailable,
            timestamp: Date.now()
          });
        }

        socket.emit('user:availability:updated', {
          success: true,
          isAvailable,
          message: isAvailable ? 'You are now available for coffee!' : 'You are now hidden from others'
        });

        logger.info(`🔄 Availability toggled for user ${userId}: ${isAvailable}`);
      } catch (error) {
        logger.error('Error toggling availability:', error);
        socket.emit('error', { message: 'Failed to update availability' });
      }
    });

    socket.on('users:nearby:request', async (data) => {
      try {
        const { city } = data;
        const nearbyUsers = await redisService.getUsersInCity(city, userId);
        socket.emit('users:nearby', nearbyUsers);
      } catch (error) {
        logger.error('Error getting nearby users:', error);
        socket.emit('error', { message: 'Failed to get nearby users' });
      }
    });

    // ============================================
    // COFFEE SHOP EVENTS
    // ============================================

    socket.on('coffee-shops:request', async (data) => {
      try {
        const { city } = data;
        
        // Check cache first
        let coffeeShops = await redisService.getCoffeeShops(city);
        
        if (!coffeeShops) {
          // Generate mock coffee shops for now (you'll integrate with real API later)
          coffeeShops = this.generateMockCoffeeShops(city);
          await redisService.setCoffeeShops(city, coffeeShops);
        }

        socket.emit('coffee-shops:data', {
          city,
          shops: coffeeShops,
          timestamp: Date.now()
        });

        logger.info(`☕ Coffee shops sent for ${city}: ${coffeeShops.length} shops`);
      } catch (error) {
        logger.error('Error getting coffee shops:', error);
        socket.emit('error', { message: 'Failed to get coffee shops' });
      }
    });

    // ============================================
    // INVITE EVENTS
    // ============================================

    socket.on('invite:send', async (data) => {
      try {
        const { toUserId, message, coffeeShopId, proposedTime } = data;

        // Create invite data
        const inviteData = {
          id: `invite_${Date.now()}_${userId}`,
          fromUserId: userId,
          toUserId,
          message: message || 'Ti andrebbe di prendere un caffè insieme?',
          coffeeShopId,
          proposedTime,
          status: 'pending',
          createdAt: Date.now()
        };

        // Store invite in Redis
        const inviteId = await redisService.storeInvite(inviteData);

        // Send invite to target user if they're online
        if (this.connectedUsers.has(toUserId)) {
          this.io.to(`user:${toUserId}`).emit('invite:received', {
            ...inviteData,
            id: inviteId
          });
        }

        // Confirm to sender
        socket.emit('invite:sent', {
          success: true,
          inviteId,
          message: 'Invito inviato con successo!'
        });

        logger.info(`💌 Invite sent from ${userId} to ${toUserId}`);
      } catch (error) {
        logger.error('Error sending invite:', error);
        socket.emit('error', { message: 'Failed to send invite' });
      }
    });

    socket.on('invite:respond', async (data) => {
      try {
        const { inviteId, response } = data; // response: 'accept' or 'decline'

        // Get invite data from Redis
        const inviteStr = await redisService.client.get(inviteId);
        if (!inviteStr) {
          socket.emit('error', { message: 'Invite not found or expired' });
          return;
        }

        const inviteData = JSON.parse(inviteStr);
        
        // Update invite status
        inviteData.status = response;
        inviteData.respondedAt = Date.now();
        
        await redisService.client.setEx(inviteId, 1800, JSON.stringify(inviteData));

        // Notify the sender
        if (this.connectedUsers.has(inviteData.fromUserId)) {
          this.io.to(`user:${inviteData.fromUserId}`).emit('invite:response', {
            inviteId,
            response,
            respondedBy: userId,
            timestamp: Date.now()
          });
        }

        // Remove from pending invites
        await redisService.client.sRem(`user:${userId}:pending_invites`, inviteId);

        socket.emit('invite:responded', {
          success: true,
          inviteId,
          response,
          message: response === 'accept' ? 'Invito accettato!' : 'Invito rifiutato'
        });

        logger.info(`📮 Invite ${inviteId} ${response} by user ${userId}`);
      } catch (error) {
        logger.error('Error responding to invite:', error);
        socket.emit('error', { message: 'Failed to respond to invite' });
      }
    });

    // ============================================
    // REAL-TIME CHAT EVENTS (for future)
    // ============================================

    socket.on('chat:message', async (data) => {
      try {
        const { toUserId, message } = data;
        
        // Send message to target user if online
        if (this.connectedUsers.has(toUserId)) {
          this.io.to(`user:${toUserId}`).emit('chat:message:received', {
            fromUserId: userId,
            message,
            timestamp: Date.now()
          });
        }

        logger.info(`💬 Message sent from ${userId} to ${toUserId}`);
      } catch (error) {
        logger.error('Error sending chat message:', error);
        socket.emit('error', { message: 'Failed to send message' });
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

        // Remove location from Redis (user is no longer active)
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
    const mockShops = [
      {
        id: 'shop_1',
        name: 'Caffè Centrale',
        latitude: 45.0704 + (Math.random() - 0.5) * 0.01,
        longitude: 7.6862 + (Math.random() - 0.5) * 0.01,
        rating: 4.5,
        priceRange: '€€',
        features: ['wifi', 'outdoor', 'quiet']
      },
      {
        id: 'shop_2',
        name: 'La Tazza d\'Oro',
        latitude: 45.0704 + (Math.random() - 0.5) * 0.01,
        longitude: 7.6862 + (Math.random() - 0.5) * 0.01,
        rating: 4.3,
        priceRange: '€',
        features: ['coworking', 'fast-wifi', 'power-outlets']
      },
      {
        id: 'shop_3',
        name: 'Caffè Torino',
        latitude: 45.0704 + (Math.random() - 0.5) * 0.01,
        longitude: 7.6862 + (Math.random() - 0.5) * 0.01,
        rating: 4.7,
        priceRange: '€€€',
        features: ['historic', 'elegant', 'pastries']
      }
    ];

    return mockShops;
  }

  // Broadcast to all users in a city
  broadcastToCity(city, event, data) {
    if (this.io) {
      this.io.to(`city:${city}`).emit(event, data);
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
      const sockets = await this.io.in(`city:${city}`).fetchSockets();
      return sockets.map(socket => socket.userId).filter(Boolean);
    } catch (error) {
      logger.error('Error getting users in city room:', error);
      return [];
    }
  }
}

module.exports = new SocketService();