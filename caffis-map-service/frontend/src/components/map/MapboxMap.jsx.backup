// caffis-map-service/frontend/src/components/map/MapboxMap.jsx
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import UserMarker from './UserMarker';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set Mapbox access token
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN || 'your_mapbox_token_here';

const MapboxMap = ({ 
  center = [7.6862, 45.0704], // Default to Turin
  zoom = 13,
  users = [],
  coffeeShops = [],
  onUserClick,
  className = "w-full h-full"
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef(new Map());
  const [mapLoaded, setMapLoaded] = useState(false);

  // ============================================
  // MAP INITIALIZATION
  // ============================================

  useEffect(() => {
    if (map.current) return; // Initialize map only once

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11', // Clean, light style
        center: center,
        zoom: zoom,
        attributionControl: false,
        logoPosition: 'bottom-left'
      });

      // Customize map controls
      map.current.addControl(new mapboxgl.NavigationControl({
        showCompass: false,
        showZoom: true
      }), 'top-right');

      // Map event listeners
      map.current.on('load', () => {
        setMapLoaded(true);
        
        // Add custom styling for Caffis
        addCustomMapLayers();
      });

      map.current.on('style.load', () => {
        // Re-add custom layers when style changes
        addCustomMapLayers();
      });

    } catch (error) {
      console.error('Error initializing Mapbox:', error);
    }

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // ============================================
  // CUSTOM MAP LAYERS
  // ============================================

  const addCustomMapLayers = () => {
    if (!map.current || !mapLoaded) return;

    try {
      // Add coffee shop data source if it doesn't exist
      if (!map.current.getSource('coffee-shops')) {
        map.current.addSource('coffee-shops', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });

        // Add coffee shop markers layer
        map.current.addLayer({
          id: 'coffee-shops-layer',
          type: 'symbol',
          source: 'coffee-shops',
          layout: {
            'icon-image': 'cafe-15', // Mapbox default icon
            'icon-size': 1.2,
            'icon-allow-overlap': true,
            'text-field': ['get', 'name'],
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-offset': [0, 1.25],
            'text-anchor': 'top',
            'text-size': 12
          },
          paint: {
            'text-color': '#8B4513',
            'text-halo-color': '#FFFFFF',
            'text-halo-width': 1
          }
        });

        // Add click handler for coffee shops
        map.current.on('click', 'coffee-shops-layer', (e) => {
          const shop = e.features[0].properties;
          
          new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`
              <div class="p-3">
                <h3 class="font-bold text-sm mb-2">${shop.name}</h3>
                <p class="text-xs text-gray-600 mb-2">${shop.address || ''}</p>
                <div class="flex justify-between items-center">
                  <span class="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">
                    ⭐ ${shop.rating || 'N/A'}
                  </span>
                  <span class="text-xs text-gray-500">${shop.priceRange || ''}</span>
                </div>
              </div>
            `)
            .addTo(map.current);
        });
      }

    } catch (error) {
      console.error('Error adding custom map layers:', error);
    }
  };

  // ============================================
  // UPDATE MAP CENTER AND ZOOM
  // ============================================

  useEffect(() => {
    if (map.current && center) {
      map.current.easeTo({
        center: center,
        zoom: zoom,
        duration: 1000
      });
    }
  }, [center, zoom]);

  // ============================================
  // UPDATE COFFEE SHOPS
  // ============================================

  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    try {
      const coffeeShopFeatures = coffeeShops.map(shop => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [shop.longitude, shop.latitude]
        },
        properties: {
          id: shop.id,
          name: shop.name,
          rating: shop.rating,
          priceRange: shop.priceRange,
          address: shop.address,
          features: shop.features?.join(', ') || ''
        }
      }));

      const source = map.current.getSource('coffee-shops');
      if (source) {
        source.setData({
          type: 'FeatureCollection',
          features: coffeeShopFeatures
        });
      }
    } catch (error) {
      console.error('Error updating coffee shops:', error);
    }
  }, [coffeeShops, mapLoaded]);

  // ============================================
  // UPDATE USER MARKERS
  // ============================================

  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing user markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();

    // Add new user markers
    users.forEach(user => {
      try {
        // Create custom marker element
        const markerElement = document.createElement('div');
        markerElement.className = 'user-marker';
        
        // Add UserMarker React component to the element
        const userMarkerComponent = React.createElement(UserMarker, {
          user: user,
          onClick: () => onUserClick && onUserClick(user)
        });

        // Render React component to DOM element
        import('react-dom').then(({ createRoot }) => {
          const root = createRoot(markerElement);
          root.render(userMarkerComponent);
        });

        // Create Mapbox marker
        const marker = new mapboxgl.Marker({
          element: markerElement,
          anchor: 'bottom'
        })
          .setLngLat([user.longitude, user.latitude])
          .addTo(map.current);

        // Store marker reference
        markersRef.current.set(user.userId, marker);

      } catch (error) {
        console.error('Error adding user marker:', error);
      }
    });

    // Cleanup markers on unmount
    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current.clear();
    };
  }, [users, mapLoaded, onUserClick]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className={`relative ${className}`}>
      {/* Map Container */}
      <div 
        ref={mapContainer} 
        className="w-full h-full rounded-2xl overflow-hidden"
        style={{ minHeight: '200px' }}
      />

      {/* Loading Overlay */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Caricamento mappa...</p>
          </div>
        </div>
      )}

      {/* Map Legend */}
      {mapLoaded && (users.length > 0 || coffeeShops.length > 0) && (
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md rounded-xl p-3 shadow-lg border border-white/20">
          <div className="text-xs space-y-2">
            {users.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full border-2 border-white shadow-md"></div>
                <span>Persone disponibili</span>
              </div>
            )}
            {coffeeShops.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs">☕</div>
                <span>Caffè partner</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Map Attribution */}
      <div className="absolute bottom-1 right-1 text-xs text-gray-400 bg-white/50 px-2 py-1 rounded">
        © Mapbox © Caffis
      </div>
    </div>
  );
};

export default MapboxMap;