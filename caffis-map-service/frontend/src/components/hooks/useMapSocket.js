// caffis-map-service/frontend/src/hooks/useMapSocket.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const useMapSocket = (token) => {
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  
  // Data state
  const [users, setUsers] = useState([]);
  const [shops, setShops] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  
  // Socket reference
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // ============================================
  // CONNECTION MANAGEMENT
  // ============================================

  const connectSocket = useCallback(() => {
    if (!token) {
      setError('No authentication token provided');
      return;
    }

    try {
      const socketUrl = process.env.REACT_APP_MAP_SERVICE_URL || 'http://localhost:5001';
      
      socketRef.current = io(socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      const socket = socketRef.current;

      // ============================================
      // CONNECTION EVENTS
      // ============================================

      socket.on('connect', () => {
        console.log('🗺️ Connected to map service');
        setIsConnected(true);
        setError(null);
        
        // Clear any reconnection timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      });

      socket.on('connected', (data) => {
        console.log('🎉 Map service connection confirmed:', data);
      });

      socket.on('disconnect', (reason) => {
        console.log('🔌 Disconnected from map service:', reason);
        setIsConnected(false);
        
        // Auto-reconnect for certain disconnect reasons
        if (reason === 'io server disconnect') {
          // Server initiated disconnect, don't reconnect
          setError('Server disconnected the connection');
        } else {
          // Client-side disconnect, attempt to reconnect
          scheduleReconnect();
        }
      });

      socket.on('connect_error', (err) => {
        console.error('🚨 Map service connection error:', err);
        setError(`Connection failed: ${err.message}`);
        setIsConnected(false);
        scheduleReconnect();
      });

      // ============================================
      // LOCATION EVENTS
      // ============================================

      socket.on('user:location:updated', (data) => {
        console.log('📍 Location updated:', data);
      });

      socket.on('user:location:new', (data) => {
        console.log('👋 New user location:', data);
        // This could update the users array in real-time
      });

      socket.on('users:nearby', (nearbyUsers) => {
        console.log('👥 Nearby users updated:', nearbyUsers);
        setUsers(nearbyUsers || []);
      });

      socket.on('user:availability:updated', (data) => {
        console.log('🔄 Availability updated:', data);
      });

      socket.on('user:availability:changed', (data) => {
        console.log('🔄 User availability changed:', data);
        // Update specific user in the users array
        setUsers(prev => prev.map(user => 
          user.userId === data.userId 
            ? { ...user, isAvailable: data.isAvailable }
            : user
        ));
      });

      socket.on('user:offline', (data) => {
        console.log('👋 User went offline:', data);
        // Remove user from the array
        setUsers(prev => prev.filter(user => user.userId !== data.userId));
      });

      // ============================================
      // COFFEE SHOP EVENTS
      // ============================================

      socket.on('coffee-shops:data', (data) => {
        console.log('☕ Coffee shops updated:', data);
        setShops(data.shops || []);
      });

      // ============================================
      // INVITE EVENTS
      // ============================================

      socket.on('invite:sent', (data) => {
        console.log('📤 Invite sent successfully:', data);
      });

      socket.on('invite:received', (inviteData) => {
        console.log('📥 Received new invite:', inviteData);
        setPendingInvites(prev => [...prev, inviteData]);
        
        // Could show a notification here
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Nuovo invito caffè!', {
            body: `${inviteData.fromUserName || 'Qualcuno'} ti ha invitato per un caffè`,
            icon: '/coffee-icon.png'
          });
        }
      });

      socket.on('invite:response', (data) => {
        console.log('📮 Invite response received:', data);
        // Handle invite response (accepted/declined)
      });

      socket.on('invite:responded', (data) => {
        console.log('✅ Invite response sent:', data);
      });

      // ============================================
      // CHAT EVENTS (for future)
      // ============================================

      socket.on('chat:message:received', (data) => {
        console.log('💬 Chat message received:', data);
        // Handle real-time chat messages
      });

      // ============================================
      // ERROR HANDLING
      // ============================================

      socket.on('error', (errorData) => {
        console.error('🚨 Map service error:', errorData);
        setError(errorData.message || 'Unknown error occurred');
      });

    } catch (err) {
      console.error('Failed to initialize socket connection:', err);
      setError('Failed to initialize connection');
    }
  }, [token]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) return; // Already scheduled
    
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log('🔄 Attempting to reconnect to map service...');
      connectSocket();
    }, 3000); // Reconnect after 3 seconds
  }, [connectSocket]);

  // ============================================
  // SOCKET API METHODS
  // ============================================

  const sendLocationUpdate = useCallback((latitude, longitude, city) => {
    if (!socketRef.current?.connected) {
      setError('Not connected to map service');
      return Promise.reject(new Error('Not connected'));
    }

    return new Promise((resolve, reject) => {
      socketRef.current.emit('user:location:update', 
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
  }, []);

  const toggleAvailability = useCallback((isAvailable) => {
    if (!socketRef.current?.connected) {
      setError('Not connected to map service');
      return Promise.reject(new Error('Not connected'));
    }

    return new Promise((resolve, reject) => {
      socketRef.current.emit('user:availability:toggle', 
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
  }, []);

  const requestNearbyUsers = useCallback((city) => {
    if (!socketRef.current?.connected) {
      setError('Not connected to map service');
      return;
    }

    socketRef.current.emit('users:nearby:request', { city });
  }, []);

  const requestCoffeeShops = useCallback((city) => {
    if (!socketRef.current?.connected) {
      setError('Not connected to map service');
      return;
    }

    socketRef.current.emit('coffee-shops:request', { city });
  }, []);

  const sendInvite = useCallback((inviteData) => {
    if (!socketRef.current?.connected) {
      setError('Not connected to map service');
      return Promise.reject(new Error('Not connected'));
    }

    return new Promise((resolve, reject) => {
      socketRef.current.emit('invite:send', 
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
  }, []);

  const respondToInvite = useCallback((inviteId, response) => {
    if (!socketRef.current?.connected) {
      setError('Not connected to map service');
      return Promise.reject(new Error('Not connected'));
    }

    return new Promise((resolve, reject) => {
      socketRef.current.emit('invite:respond', 
        { inviteId, response },
        (responseData) => {
          if (responseData?.error) {
            reject(new Error(responseData.error));
          } else {
            // Remove invite from pending list
            setPendingInvites(prev => prev.filter(invite => invite.id !== inviteId));
            resolve(responseData);
          }
        }
      );
    });
  }, []);

  const sendChatMessage = useCallback((toUserId, message) => {
    if (!socketRef.current?.connected) {
      setError('Not connected to map service');
      return;
    }

    socketRef.current.emit('chat:message', { toUserId, message });
  }, []);

  // ============================================
  // LIFECYCLE MANAGEMENT
  // ============================================

  useEffect(() => {
    if (token) {
      connectSocket();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [token, connectSocket]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // ============================================
  // RETURN HOOK API
  // ============================================

  return {
    // Connection state
    isConnected,
    error,
    
    // Data
    users,
    shops,
    pendingInvites,
    
    // Methods
    sendLocationUpdate,
    toggleAvailability,
    requestNearbyUsers,
    requestCoffeeShops,
    sendInvite,
    respondToInvite,
    sendChatMessage,
    
    // Utils
    reconnect: connectSocket,
    disconnect: () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    }
  };
};

export default useMapSocket;