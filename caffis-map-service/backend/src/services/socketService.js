// caffis-map-service/backend/src/services/socketService.js
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const redisService = require('./redisService');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socket mapping
    this.userRooms = new Map(); // userId -> room mapping
  }

  init(io) {
    this.io = io;
    this.setupMiddleware();
    this.setupEventHandlers();
    logger.info('Socket.IO service initialized');
  }

  setupMiddleware() {
    // JWT Authentication middleware
    this.io.use((socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId || decoded.id;
        socket.userEmail = decoded.email;
        
        logger.debug(`Socket authenticated for user: ${socket.userId}`);
        next();
      } catch (error) {
        logger.error('Socket authentication failed:', error.message);
        next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });
  }

  handleConnection(socket) {
    const userId = socket.userId;
    logger.info(`User connected: ${userId} (Socket: ${socket.id})`);

    // Store user connection
    this.connectedUsers.set(userId, socket);

    // Handle user location updates
    socket.on('user:location:update', async (data) => {
      await this.handleLocationUpdate(socket, data);
    });

    // Handle user availability toggle
    socket.on('user:availability:toggle', async (data) => {
      await this.handleAvailabilityToggle(socket, data);
    });

    // Handle coffee invite sending
    socket.on('invite:send', async (data) => {
      await this.handleInviteSend(socket, data);
    });

    // Handle coffee invite response
    socket.on('invite:response', async (data) => {
      await this.handleInviteResponse(socket, data);
    });

    // Handle joining city room
    socket.on('join:city', async (data) => {
      await this.handleJoinCity(socket, data);
    });

    // Handle leaving city room
    socket.on('leave:city', async (data) => {
      await this.handleLeaveCity(socket, data);
    });

    // Handle user profile request
    socket.on('user:profile:request', async (data) => {
      await this.handleProfileRequest(socket, data);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });

    // Send welcome message
    socket.emit('connection:success', {
      message: 'Connected to Caffis Map Service',
      userId: userId,
      timestamp: new Date().toISOString()
    });
  }

  async handleLocationUpdate(socket, data) {
    try {
      const { latitude, longitude, city, isAvailable } = data;
      const userId = socket.userId;

      // Validate data
      if (!latitude || !longitude || !city) {
        socket.emit('error', { message: 'Invalid location data' });
        return;
      }

      // Store location in Redis
      const locationData = {
        userId,
        latitude,
        longitude,
        city: city.toLowerCase(),
        isAvailable: isAvailable !== undefined ? isAvailable : true,
        timestamp: new Date().toISOString()
      };

      await redisService.set(`location:${userId}`, locationData, 300); // 5 minutes TTL

      // Join city room
      const cityRoom = `city:${city.toLowerCase()}`;
      const previousRoom = this.userRooms.get(userId);
      
      if (previousRoom && previousRoom !== cityRoom) {
        socket.leave(previousRoom);
      }
      
      socket.join(cityRoom);
      this.userRooms.set(userId, cityRoom);

      // Add user to city users set
      await redisService.sAdd(`city_users:${city.toLowerCase()}`, userId);
      await redisService.expire(`city_users:${city.toLowerCase()}`, 300);

      // Broadcast to other users in the same city
      socket.to(cityRoom).emit('user:location:new', {
        userId,
        latitude,
        longitude,
        isAvailable,
        timestamp: locationData.timestamp
      });

      // Confirm update to sender
      socket.emit('location:updated', {
        success: true,
        city: cityRoom,
        timestamp: locationData.timestamp
      });

      logger.debug(`Location updated for user ${userId} in ${city}`);

    } catch (error) {
      logger.error('Error handling location update:', error);
      socket.emit('error', { message: 'Failed to update location' });
    }
  }

  async handleAvailabilityToggle(socket, data) {
    try {
      const { isAvailable } = data;
      const userId = socket.userId;

      // Get current location
      const currentLocation = await redisService.get(`location:${userId}`);
      
      if (!currentLocation) {
        socket.emit('error', { message: 'No location found. Please update location first.' });
        return;
      }

      // Update availability
      currentLocation.isAvailable = isAvailable;
      currentLocation.timestamp = new Date().toISOString();

      await redisService.set(`location:${userId}`, currentLocation, 300);

      // Broadcast to city room
      const cityRoom = this.userRooms.get(userId);
      if (cityRoom) {
        socket.to(cityRoom).emit('user:availability:changed', {
          userId,
          isAvailable,
          timestamp: currentLocation.timestamp
        });
      }

      socket.emit('availability:updated', {
        success: true,
        isAvailable,
        timestamp: currentLocation.timestamp
      });

      logger.debug(`Availability toggled for user ${userId}: ${isAvailable}`);

    } catch (error) {
      logger.error('Error handling availability toggle:', error);
      socket.emit('error', { message: 'Failed to update availability' });
    }
  }

  async handleInviteSend(socket, data) {
    try {
      const { toUserId, message, coffeeShopId, coffeeShopName } = data;
      const fromUserId = socket.userId;

      // Validate data
      if (!toUserId) {
        socket.emit('error', { message: 'Recipient user ID is required' });
        return;
      }

      // Get recipient socket
      const recipientSocket = this.connectedUsers.get(toUserId);
      
      const inviteData = {
        id: `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fromUserId,
        toUserId,
        message: message || 'Would you like to get coffee together?',
        coffeeShopId,
        coffeeShopName,
        timestamp: new Date().toISOString(),
        status: 'pending'
      };

      // Store invite in Redis
      await redisService.set(`invite:${inviteData.id}`, inviteData, 3600); // 1 hour TTL

      // Send to recipient if online
      if (recipientSocket) {
        recipientSocket.emit('invite:received', inviteData);
      }

      // Confirm to sender
      socket.emit('invite:sent', {
        success: true,
        inviteId: inviteData.id,
        timestamp: inviteData.timestamp
      });

      logger.debug(`Invite sent from ${fromUserId} to ${toUserId}`);

    } catch (error) {
      logger.error('Error handling invite send:', error);
      socket.emit('error', { message: 'Failed to send invite' });
    }
  }

  async handleInviteResponse(socket, data) {
    try {
      const { inviteId, response } = data; // response: 'accept' or 'decline'
      const userId = socket.userId;

      // Get invite data
      const invite = await redisService.get(`invite:${inviteId}`);
      
      if (!invite) {
        socket.emit('error', { message: 'Invite not found or expired' });
        return;
      }

      if (invite.toUserId !== userId) {
        socket.emit('error', { message: 'Unauthorized to respond to this invite' });
        return;
      }

      // Update invite status
      invite.status = response;
      invite.responseTimestamp = new Date().toISOString();
      
      await redisService.set(`invite:${inviteId}`, invite, 3600);

      // Notify sender
      const senderSocket = this.connectedUsers.get(invite.fromUserId);
      if (senderSocket) {
        senderSocket.emit('invite:response:received', {
          inviteId,
          response,
          fromUserId: userId,
          timestamp: invite.responseTimestamp
        });
      }

      // Confirm to responder
      socket.emit('invite:response:sent', {
        success: true,
        inviteId,
        response,
        timestamp: invite.responseTimestamp
      });

      logger.debug(`Invite ${inviteId} ${response} by user ${userId}`);

    } catch (error) {
      logger.error('Error handling invite response:', error);
      socket.emit('error', { message: 'Failed to respond to invite' });
    }
  }

  async handleJoinCity(socket, data) {
    try {
      const { city } = data;
      const userId = socket.userId;

      if (!city) {
        socket.emit('error', { message: 'City is required' });
        return;
      }

      const cityRoom = `city:${city.toLowerCase()}`;
      const previousRoom = this.userRooms.get(userId);

      // Leave previous room
      if (previousRoom && previousRoom !== cityRoom) {
        socket.leave(previousRoom);
      }

      // Join new room
      socket.join(cityRoom);
      this.userRooms.set(userId, cityRoom);

      socket.emit('city:joined', {
        success: true,
        city: cityRoom,
        timestamp: new Date().toISOString()
      });

      logger.debug(`User ${userId} joined city room: ${cityRoom}`);

    } catch (error) {
      logger.error('Error handling join city:', error);
      socket.emit('error', { message: 'Failed to join city' });
    }
  }

  async handleLeaveCity(socket, data) {
    try {
      const userId = socket.userId;
      const currentRoom = this.userRooms.get(userId);

      if (currentRoom) {
        socket.leave(currentRoom);
        this.userRooms.delete(userId);

        socket.emit('city:left', {
          success: true,
          city: currentRoom,
          timestamp: new Date().toISOString()
        });

        logger.debug(`User ${userId} left city room: ${currentRoom}`);
      }

    } catch (error) {
      logger.error('Error handling leave city:', error);
      socket.emit('error', { message: 'Failed to leave city' });
    }
  }

  async handleProfileRequest(socket, data) {
    try {
      const { userId: requestedUserId } = data;

      if (!requestedUserId) {
        socket.emit('error', { message: 'User ID is required' });
        return;
      }

      // Get user profile from cache or main API
      let userProfile = await redisService.get(`user_profile:${requestedUserId}`);

      if (!userProfile) {
        // If not in cache, you would typically fetch from main API here
        // For now, return a basic profile
        userProfile = {
          userId: requestedUserId,
          name: 'Unknown User',
          cached: false
        };
      }

      socket.emit('user:profile:response', {
        success: true,
        profile: userProfile,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error handling profile request:', error);
      socket.emit('error', { message: 'Failed to get user profile' });
    }
  }

  handleDisconnect(socket) {
    const userId = socket.userId;
    
    // Remove user from connected users
    this.connectedUsers.delete(userId);
    
    // Remove from room mapping
    const room = this.userRooms.get(userId);
    if (room) {
      this.userRooms.delete(userId);
    }

    // You might want to broadcast user offline status here
    if (room) {
      socket.to(room).emit('user:disconnected', {
        userId,
        timestamp: new Date().toISOString()
      });
    }

    logger.info(`User disconnected: ${userId} (Socket: ${socket.id})`);
  }

  // Utility methods
  broadcast(event, data) {
    this.io.emit(event, data);
  }

  broadcastToCity(city, event, data) {
    this.io.to(`city:${city.toLowerCase()}`).emit(event, data);
  }

  sendToUser(userId, event, data) {
    const socket = this.connectedUsers.get(userId);
    if (socket) {
      socket.emit(event, data);
      return true;
    }
    return false;
  }

  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  getConnectedUsersByCity() {
    const cityUsers = {};
    for (const [userId, room] of this.userRooms.entries()) {
      if (!cityUsers[room]) {
        cityUsers[room] = [];
      }
      cityUsers[room].push(userId);
    }
    return cityUsers;
  }
}

module.exports = new SocketService();