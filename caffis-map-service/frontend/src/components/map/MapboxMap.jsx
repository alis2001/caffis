import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

// Use window globals instead of process.env for browser compatibility
const MAPBOX_TOKEN = window.REACT_APP_MAPBOX_TOKEN || 'pk.eyJ1IjoiYWxpc2Jhc3NhbSIsImEiOiJjbHJ3aTQyYmgwNGRqMmxvNGEwNGU5MmV3In0.IkJDe4u1S4hEqMNLSUCkyA';

mapboxgl.accessToken = MAPBOX_TOKEN;

const MapboxMap = ({ 
  onMapLoad, 
  onLocationUpdate,
  center = [7.6869, 45.0703], // Turin coordinates
  zoom = 13 
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (map.current) return; // Map already initialized

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: center,
        zoom: zoom
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl());

      // Map loaded callback
      map.current.on('load', () => {
        console.log('✅ Mapbox map loaded successfully');
        if (onMapLoad) onMapLoad(map.current);
      });

      // Click handler for location updates
      map.current.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        console.log('📍 Map clicked:', { lng, lat });
        if (onLocationUpdate) onLocationUpdate({ lng, lat });
      });

    } catch (error) {
      console.error('❌ Error initializing Mapbox:', error);
    }

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [center, zoom, onMapLoad, onLocationUpdate]);

  return (
    <div 
      ref={mapContainer} 
      style={{ 
        width: '100%', 
        height: '100%',
        minHeight: '400px'
      }} 
    />
  );
};

export default MapboxMap;
