// caffis-map-service/frontend/src/components/DraggableMapWidget.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, useDragControls } from 'framer-motion';
import MapboxMap from './map/MapboxMap';
import AvailabilityToggle from './ui/AvailabilityToggle';
import UserProfilePopup from './ui/UserProfilePopup';
import useMapSocket from './hooks/useMapSocket';
import useGeolocation from './hooks/useGeolocation';
import { MapPin, Maximize2, Minimize2, X, Coffee, Users } from 'lucide-react';

const DraggableMapWidget = ({ 
  token, 
  onClose, 
  initialPosition = { x: 100, y: 100 },
  className = "" 
}) => {
  // Widget state
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showProfilePopup, setShowProfilePopup] = useState(false);

  // Map state
  const [isAvailable, setIsAvailable] = useState(false);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [coffeeShops, setCoffeeShops] = useState([]);
  const [currentCity, setCurrentCity] = useState('torino');

  // Hooks
  const { location, error: locationError, requestLocation } = useGeolocation();
  const { 
    isConnected, 
    users, 
    shops,
    sendLocationUpdate,
    toggleAvailability,
    sendInvite,
    error: socketError 
  } = useMapSocket(token);

  // Drag controls
  const dragControls = useDragControls();
  const constraintsRef = useRef(null);

  // ============================================
  // COMPONENT LIFECYCLE
  // ============================================

  useEffect(() => {
    // Set constraints to window size
    if (constraintsRef.current && typeof window !== 'undefined') {
      constraintsRef.current = {
        left: 0,
        right: window.innerWidth - 400,
        top: 0,
        bottom: window.innerHeight - 300
      };
    }
  }, []);

  useEffect(() => {
    // Update nearby users when socket data changes
    if (users) {
      setNearbyUsers(users);
    }
  }, [users]);

  useEffect(() => {
    // Update coffee shops when socket data changes
    if (shops) {
      setCoffeeShops(shops);
    }
  }, [shops]);

  // ============================================
  // EVENT HANDLERS
  // ============================================

  const handleAvailabilityToggle = async () => {
    if (!location) {
      await requestLocation();
      return;
    }

    const newAvailability = !isAvailable;
    setIsAvailable(newAvailability);

    if (newAvailability) {
      // Send location update and set available
      await sendLocationUpdate(location.latitude, location.longitude, currentCity);
    }
    
    await toggleAvailability(newAvailability);
  };

  const handleUserMarkerClick = (user) => {
    setSelectedUser(user);
    setShowProfilePopup(true);
  };

  const handleSendInvite = async (message, coffeeShopId) => {
    if (!selectedUser) return;

    try {
      await sendInvite({
        toUserId: selectedUser.userId,
        message,
        coffeeShopId,
        proposedTime: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes from now
      });
      
      setShowProfilePopup(false);
      // Show success notification
    } catch (error) {
      console.error('Failed to send invite:', error);
      // Show error notification
    }
  };

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
    setIsExpanded(false);
  };

  // ============================================
  // WIDGET DIMENSIONS
  // ============================================

  const getWidgetSize = () => {
    if (isMinimized) {
      return { width: 200, height: 60 };
    }
    if (isExpanded) {
      return { width: 800, height: 600 };
    }
    return { width: 400, height: 300 };
  };

  const widgetSize = getWidgetSize();

  // ============================================
  // RENDER
  // ============================================

  return (
    <>
      <motion.div
        drag
        dragControls={dragControls}
        dragMomentum={false}
        dragConstraints={constraintsRef.current}
        initial={initialPosition}
        className={`fixed z-50 ${className}`}
        style={{
          width: widgetSize.width,
          height: widgetSize.height
        }}
        whileDrag={{ scale: 1.02, rotate: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Widget Container */}
        <div className="w-full h-full bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          
          {/* Header Bar */}
          <div 
            className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 cursor-move border-b border-white/10"
            onPointerDown={(e) => dragControls.start(e)}
          >
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white shadow-lg"
              >
                <MapPin size={16} />
              </motion.div>
              
              <div>
                <h3 className="font-bold text-gray-900 text-sm">
                  Caffis Map
                </h3>
                {!isMinimized && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span>{isConnected ? 'Connesso' : 'Disconnesso'}</span>
                    {nearbyUsers.length > 0 && (
                      <>
                        <Users size={12} />
                        <span>{nearbyUsers.length} persone vicine</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Connection Status */}
              <motion.div
                animate={isConnected ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
                className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
              />

              {/* Controls */}
              <motion.button
                onClick={handleMinimize}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Minimize2 size={14} />
              </motion.button>
              
              <motion.button
                onClick={handleExpand}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Maximize2 size={14} />
              </motion.button>
              
              <motion.button
                onClick={onClose}
                className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={14} />
              </motion.button>
            </div>
          </div>

          {/* Widget Content */}
          {!isMinimized && (
            <div className="flex-1 flex flex-col h-full">
              {/* Availability Toggle */}
              <div className="p-4 border-b border-white/10">
                <AvailabilityToggle
                  isAvailable={isAvailable}
                  onToggle={handleAvailabilityToggle}
                  isLoading={!location && isAvailable}
                  disabled={!isConnected}
                />
                
                {locationError && (
                  <p className="text-xs text-red-500 mt-2">
                    ⚠️ {locationError}
                  </p>
                )}
                
                {socketError && (
                  <p className="text-xs text-red-500 mt-2">
                    🔌 {socketError}
                  </p>
                )}
              </div>

              {/* Map Container */}
              <div className="flex-1 relative">
                {location && isAvailable ? (
                  <MapboxMap
                    center={[location.longitude, location.latitude]}
                    zoom={isExpanded ? 15 : 13}
                    users={nearbyUsers}
                    coffeeShops={coffeeShops}
                    onUserClick={handleUserMarkerClick}
                    className="w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 text-gray-600">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="text-4xl mb-4"
                    >
                      <Coffee />
                    </motion.div>
                    <p className="text-sm text-center px-4">
                      {!location 
                        ? "Abilita la posizione per vedere la mappa"
                        : "Attiva la disponibilità per connetterti con altri utenti"
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              {isAvailable && (
                <div className="p-3 bg-white/50 backdrop-blur-md border-t border-white/10">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Users size={12} className="text-blue-500" />
                        {nearbyUsers.length} persone
                      </span>
                      <span className="flex items-center gap-1">
                        <Coffee size={12} className="text-orange-500" />
                        {coffeeShops.length} caffè
                      </span>
                    </div>
                    <span className="text-gray-500">
                      📍 {currentCity}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Minimized State */}
          {isMinimized && (
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-sm font-medium">
                  {isAvailable ? `${nearbyUsers.length} persone vicine` : 'Non disponibile'}
                </span>
              </div>
              <motion.button
                onClick={handleExpand}
                className="p-1 hover:bg-white/20 rounded"
                whileHover={{ scale: 1.1 }}
              >
                <Maximize2 size={12} />
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>

      {/* User Profile Popup */}
      {showProfilePopup && selectedUser && (
        <UserProfilePopup
          user={selectedUser}
          onClose={() => setShowProfilePopup(false)}
          onSendInvite={handleSendInvite}
          coffeeShops={coffeeShops}
        />
      )}
    </>
  );
};

export default DraggableMapWidget;