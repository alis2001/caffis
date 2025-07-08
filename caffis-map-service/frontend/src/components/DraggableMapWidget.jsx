// components/DraggableMapWidget.jsx
import React, { useState, useRef, useEffect } from 'react';
import MapboxMap from './map/MapboxMap';
import AvailabilityToggle from './ui/AvailabilityToggle';
import { mapApi } from '../services/mapApi';
import { ITALIAN_CITIES } from '../utils/coordinates';

const DraggableMapWidget = ({ 
  token,
  mapboxToken,
  onClose = () => console.log('Close clicked'),
  initialPosition = { x: 50, y: 50 }
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [mapLoading, setMapLoading] = useState(true);
  const [nearbyUsers, setNearbyUsers] = useState(0);

  const dragRef = useRef(null);
  const dragStartPos = useRef({ x: 0, y: 0 });

  // Set auth token for API calls
  useEffect(() => {
    if (token) {
      mapApi.setAuthToken(token);
    }
  }, [token]);

  // Handle venue selection
  const handleVenueClick = (venue) => {
    console.log('🏪 Venue selected:', venue);
    setSelectedVenue(venue);
    
    // You can add more logic here:
    // - Mark venue as visited
    // - Show detailed venue modal
    // - Send coffee invite at this venue
  };

  // Handle availability toggle
  const handleAvailabilityToggle = async (newAvailability) => {
    try {
      setIsAvailable(newAvailability);
      await mapApi.toggleAvailability(newAvailability);
      console.log('Availability updated:', newAvailability);
    } catch (error) {
      console.error('Error updating availability:', error);
      // Revert on error
      setIsAvailable(!newAvailability);
    }
  };

  // Drag handlers
  const handleMouseDown = (e) => {
    if (!e.target.closest('.widget-header')) return;
    
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const newX = Math.max(0, Math.min(
      window.innerWidth - (isMaximized ? window.innerWidth * 0.9 : 400),
      e.clientX - dragStartPos.current.x
    ));
    const newY = Math.max(0, Math.min(
      window.innerHeight - (isMaximized ? window.innerHeight * 0.9 : 300),
      e.clientY - dragStartPos.current.y
    ));

    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  // Fullscreen mode
  if (isMaximized) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
        <div className="absolute inset-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="widget-header flex items-center justify-between p-4 bg-gradient-to-r from-orange-500 to-red-500 text-white">
            <h2 className="text-xl font-bold flex items-center gap-2">
              🍕 Caffè di Napoli
              {selectedVenue && (
                <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                  {selectedVenue.name}
                </span>
              )}
            </h2>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsMaximized(false)}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                📉 Riduci
              </button>
              <button 
                onClick={onClose}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                ✕ Chiudi
              </button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
            <AvailabilityToggle
              isAvailable={isAvailable}
              onToggle={handleAvailabilityToggle}
              nearbyUsersCount={nearbyUsers}
            />
            <div className="text-sm text-gray-600">
              📍 Centro di Napoli • {ITALIAN_CITIES.napoli.name}
            </div>
          </div>

          {/* Full Map */}
          <div className="h-[calc(100%-140px)]">
            <MapboxMap 
              center={[ITALIAN_CITIES.napoli.longitude, ITALIAN_CITIES.napoli.latitude]}
              zoom={13}
              onVenueClick={handleVenueClick}
              mapboxToken={mapboxToken}
            />
          </div>
        </div>
      </div>
    );
  }

  // Regular widget mode
  return (
    <div 
      className={`
        fixed z-40 bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-300
        ${isMinimized ? 'w-80 h-16' : 'w-96 h-80'}
        ${isDragging ? 'cursor-grabbing shadow-3xl' : 'cursor-auto'}
      `}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="widget-header flex items-center justify-between p-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-2xl cursor-move">
        <h3 className="font-bold flex items-center gap-2">
          🗺️ Caffè Napoli
          {selectedVenue && (
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
              {selectedVenue.name}
            </span>
          )}
        </h3>
        <div className="flex gap-1">
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            {isMinimized ? '📖' : '📕'}
          </button>
          <button 
            onClick={() => setIsMaximized(true)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            📈
          </button>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <>
          {/* Toolbar */}
          <div className="p-3 bg-gray-50 border-b flex items-center justify-between">
            <AvailabilityToggle
              isAvailable={isAvailable}
              onToggle={handleAvailabilityToggle}
              nearbyUsersCount={nearbyUsers}
              className="text-xs"
            />
            <div className="text-xs text-gray-600">
              📍 Napoli
            </div>
          </div>

          {/* Map */}
          <div className="h-64">
            <MapboxMap 
              center={[ITALIAN_CITIES.napoli.longitude, ITALIAN_CITIES.napoli.latitude]}
              zoom={13}
              onVenueClick={handleVenueClick}
              mapboxToken={mapboxToken}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default DraggableMapWidget;