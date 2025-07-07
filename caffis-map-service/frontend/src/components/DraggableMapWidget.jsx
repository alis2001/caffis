import React, { useState } from 'react';
import MapboxMap from './map/MapboxMap';

const DraggableMapWidget = ({ 
  token = 'demo-token', 
  onClose = () => console.log('Close clicked'),
  initialPosition = { x: 50, y: 50 }
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  const handleMapLoad = (mapInstance) => {
    console.log('🗺️ Map loaded in widget');
    
    // Add a marker for demonstration
    try {
      new window.mapboxgl.Marker()
        .setLngLat([7.6869, 45.0703]) // Turin
        .addTo(mapInstance);
    } catch (error) {
      console.log('Could not add marker:', error);
    }
  };

  const handleLocationClick = (location) => {
    console.log('📍 Location selected:', location);
  };

  return (
    <div style={{
      position: 'fixed',
      top: `${initialPosition.y}px`,
      left: `${initialPosition.x}px`,
      width: isMinimized ? '300px' : '500px',
      height: isMinimized ? '60px' : '400px',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
      zIndex: 1000,
      overflow: 'hidden',
      border: '1px solid #ddd'
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 15px',
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #ddd',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, fontSize: '16px', color: '#333' }}>
          🗺️ Caffis Map
        </h3>
        <div>
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            style={{ 
              marginRight: '10px', 
              padding: '5px 10px', 
              border: 'none', 
              borderRadius: '4px',
              backgroundColor: '#6c757d',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            {isMinimized ? '📖' : '📕'}
          </button>
          <button 
            onClick={onClose}
            style={{ 
              padding: '5px 10px', 
              border: 'none', 
              borderRadius: '4px',
              backgroundColor: '#dc3545',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Map Content */}
      {!isMinimized && (
        <div style={{ height: 'calc(100% - 60px)' }}>
          <MapboxMap 
            onMapLoad={handleMapLoad}
            onLocationUpdate={handleLocationClick}
          />
        </div>
      )}
    </div>
  );
};

export default DraggableMapWidget;
