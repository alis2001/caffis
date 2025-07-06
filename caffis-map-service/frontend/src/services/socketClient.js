// caffis-map-service/frontend/src/services/socketClient.js
import { io } from 'socket.io-client';

class SocketClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
    
    // Event handlers
    this.onConnect = null;
    this.onDisconnect = null;
    this.onError = null;
    this.onReconnect = null;
  }

  // ============================================
  // CONNECTION MANAGEMENT
  // ============================================

  /**
   * Connect to the map service
   */
  connect(token, options = {}) {
    const defaultOptions = {
      url: process.env.REACT_APP_MAP_SERVICE_URL || 'http://localhost:5001',
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
      ...options
    };

    if (!token) {
      console.error('Authentication token is required for socket connection');
      return Promise.reject(new Error('No authentication token provided'));
    }

    return new Promise((resolve, reject) => {
      try {
        // Disconnect existing connection if any
        this.disconnect();

        // Create new socket connection
        this.socket = io(defaultOptions.url, {
          auth: { token },
          transports: defaultOptions.transports,
          timeout: defaultOptions.timeout,
          forceNew: defaultOptions.forceNew
        });

        // Setup event listeners
        this.setupEventListeners(resolve, reject);

      } catch (error) {
        console.error('Error creating socket connection:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the map service
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.reconnectAttempts = 0;
  }

  /**
   * Reconnect to the map service
   */
  reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return Promise.reject(new Error('Max reconnection attempts reached'));
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;

    console.log(`Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts})`);

    return new Promise((resolve) => {
      setTimeout(() => {
        if (this.socket) {
          this.socket.connect();
          resolve();
        }
      }, delay);
    });
  }

  // ============================================
  // EVENT LISTENER SETUP
  // ============================================

  setupEventListeners(resolveConnection, rejectConnection) {
    if (!this.socket) return;

    // Connection successful
    this.socket.on('connect', () => {
      console.log('🗺️ Connected to map service via Socket.IO');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      if (this.onConnect) {
        this.onConnect();
      }
      
      if (resolveConnection) {
        resolveConnection();
      }
    });

    // Connection confirmed by server
    this.socket.on('connected', (data) => {
      console.log('🎉 Map service connection confirmed:', data);
    });

    // Disconnection
    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from map service:', reason);
      this.isConnected = false;
      
      if (this.onDisconnect) {
        this.onDisconnect(reason);
      }

      // Auto-reconnect logic
      if (reason !== 'io server disconnect' && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnect();
      }
    });

    // Connection error
    this.socket.on('connect_error', (error) => {
      console.error('🚫 Socket connection error:', error);
      
      if (this.onError) {
        this.onError(error);
      }
      
      if (rejectConnection) {
        rejectConnection(error);
      }
    });

    // Reconnection successful
    this.socket.on('reconnect', () => {
      console.log('🔄 Reconnected to map service');
      this.isConnected = true;
      
      if (this.onReconnect) {
        this.onReconnect();
      }
    });

    // Setup map-specific event listeners
    this.setupMapEventListeners();
  }

  // ============================================
  // MAP-SPECIFIC EVENT LISTENERS
  // ============================================

  setupMapEventListeners() {
    if (!this.socket) return;

    // User location updates
    this.socket.on('user:location:updated', (data) => {
      this.emit('userLocationUpdated', data);
    });

    this.socket.on('user:location:new', (data) => {
      this.emit('userLocationNew', data);
    });

    this.socket.on('user:left', (data) => {
      this.emit('userLeft', data);
    });

    // Availability changes
    this.socket.on('user:availability:changed', (data) => {
      this.emit('userAvailabilityChanged', data);
    });

    // Nearby users
    this.socket.on('users:nearby:response', (data) => {
      this.emit('nearbyUsersReceived', data);
    });

    // Coffee shops
    this.socket.on('coffee-shops:response', (data) => {
      this.emit('coffeeShopsReceived', data);
    });

    // Invites
    this.socket.on('invite:received', (data) => {
      this.emit('inviteReceived', data);
    });

    this.socket.on('invite:response', (data) => {
      this.emit('inviteResponse', data);
    });

    this.socket.on('invite:sent', (data) => {
      this.emit('inviteSent', data);
    });

    // Chat messages
    this.socket.on('chat:message', (data) => {
      this.emit('chatMessage', data);
    });

    // Errors
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.emit('socketError', error);
    });
  }

  // ============================================
  // EVENT EMITTER FUNCTIONALITY
  // ============================================

  /**
   * Add event listener
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // Return unsubscribe function
    return () => {
      this.off(event, callback);
    };
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to all listeners
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for '${event}':`, error);
        }
      });
    }
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(event) {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  // ============================================
  // MAP SERVICE METHODS
  // ============================================

  /**
   * Update user location
   */
  updateLocation(latitude, longitude, city) {
    if (!this.isConnected) {
      return Promise.reject(new Error('Not connected to map service'));
    }

    return new Promise((resolve, reject) => {
      this.socket.emit('user:location:update', 
        { latitude, longitude, city },
        (response) => {
          if (response?.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        }
      );
    });
  }

  /**
   * Toggle availability
   */
  toggleAvailability(isAvailable) {
    if (!this.isConnected) {
      return Promise.reject(new Error('Not connected to map service'));
    }

    return new Promise((resolve, reject) => {
      this.socket.emit('user:availability:toggle', 
        { isAvailable },
        (response) => {
          if (response?.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        }
      );
    });
  }

  /**
   * Request nearby users
   */
  requestNearbyUsers(city, radius = 5000) {
    if (!this.isConnected) {
      console.warn('Not connected to map service');
      return;
    }

    this.socket.emit('users:nearby:request', { city, radius });
  }

  /**
   * Request coffee shops
   */
  requestCoffeeShops(city, latitude, longitude, radius = 2000) {
    if (!this.isConnected) {
      console.warn('Not connected to map service');
      return;
    }

    this.socket.emit('coffee-shops:request', { 
      city, 
      latitude, 
      longitude, 
      radius 
    });
  }

  /**
   * Send invite
   */
  sendInvite(inviteData) {
    if (!this.isConnected) {
      return Promise.reject(new Error('Not connected to map service'));
    }

    return new Promise((resolve, reject) => {
      this.socket.emit('invite:send', 
        inviteData,
        (response) => {
          if (response?.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        }
      );
    });
  }

  /**
   * Respond to invite
   */
  respondToInvite(inviteId, response) {
    if (!this.isConnected) {
      return Promise.reject(new Error('Not connected to map service'));
    }

    return new Promise((resolve, reject) => {
      this.socket.emit('invite:respond', 
        { inviteId, response },
        (responseData) => {
          if (responseData?.error) {
            reject(new Error(responseData.error));
          } else {
            resolve(responseData);
          }
        }
      );
    });
  }

  /**
   * Send chat message
   */
  sendChatMessage(toUserId, message) {
    if (!this.isConnected) {
      console.warn('Not connected to map service');
      return;
    }

    this.socket.emit('chat:message', { toUserId, message });
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      socketId: this.socket?.id || null
    };
  }

  /**
   * Set event handlers
   */
  setEventHandlers({ onConnect, onDisconnect, onError, onReconnect }) {
    this.onConnect = onConnect;
    this.onDisconnect = onDisconnect;
    this.onError = onError;
    this.onReconnect = onReconnect;
  }

  /**
   * Check if socket is connected
   */
  isSocketConnected() {
    return this.socket?.connected || false;
  }
}

// Create and export singleton instance
const socketClient = new SocketClient();

export default socketClient;