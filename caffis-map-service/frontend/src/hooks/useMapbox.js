// caffis-map-service/frontend/src/hooks/useMapbox.js
import { useState, useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';

const useMapbox = ({ 
  containerRef, 
  center = [7.6862, 45.0704], 
  zoom = 13,
  style = 'mapbox://styles/mapbox/light-v11'
}) => {
  // State
  const [map, setMap] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  // Refs
  const markersRef = useRef(new Map());
  const popupsRef = useRef(new Map());

  // ============================================
  // MAP INITIALIZATION
  // ============================================

  useEffect(() => {
    if (!containerRef.current || !mapboxgl.accessToken) {
      setError('Missing map container or Mapbox token');
      return;
    }

    try {
      const mapInstance = new mapboxgl.Map({
        container: containerRef.current,
        style: style,
        center: center,
        zoom: zoom,
        attributionControl: false,
        logoPosition: 'bottom-left'
      });

      // Add navigation controls
      mapInstance.addControl(
        new mapboxgl.NavigationControl({
          showCompass: false,
          showZoom: true
        }), 
        'top-right'
      );

      // Map event listeners
      mapInstance.on('load', () => {
        setIsLoaded(true);
        console.log('🗺️ Mapbox map loaded');
      });

      mapInstance.on('error', (e) => {
        console.error('Mapbox error:', e);
        setError('Map loading error');
      });

      setMap(mapInstance);

      // Cleanup function
      return () => {
        if (mapInstance) {
          mapInstance.remove();
        }
      };
    } catch (err) {
      console.error('Error initializing Mapbox:', err);
      setError('Failed to initialize map');
    }
  }, [containerRef, center, zoom, style]);

  // ============================================
  // MARKER MANAGEMENT
  // ============================================

  const addMarker = useCallback((id, coordinates, options = {}) => {
    if (!map || !isLoaded) return null;

    try {
      // Remove existing marker if it exists
      removeMarker(id);

      const {
        color = '#FF6B6B',
        size = 'medium',
        onClick,
        popup,
        className = '',
        draggable = false
      } = options;

      // Create marker element
      const el = document.createElement('div');
      el.className = `mapbox-marker ${className}`;
      el.style.cssText = `
        width: ${size === 'small' ? '20px' : size === 'large' ? '40px' : '30px'};
        height: ${size === 'small' ? '20px' : size === 'large' ? '40px' : '30px'};
        background-color: ${color};
        border: 2px solid white;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        transition: all 0.2s ease;
      `;

      // Add hover effects
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.1)';
        el.style.zIndex = '1000';
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
        el.style.zIndex = '1';
      });

      // Create marker
      const marker = new mapboxgl.Marker({
        element: el,
        draggable: draggable
      })
        .setLngLat(coordinates)
        .addTo(map);

      // Add click handler
      if (onClick) {
        el.addEventListener('click', () => onClick(id, coordinates));
      }

      // Add popup if provided
      if (popup) {
        const mapboxPopup = new mapboxgl.Popup({
          offset: 25,
          closeButton: true,
          closeOnClick: false
        }).setHTML(popup);

        marker.setPopup(mapboxPopup);
        popupsRef.current.set(id, mapboxPopup);
      }

      // Store marker reference
      markersRef.current.set(id, marker);

      return marker;
    } catch (err) {
      console.error('Error adding marker:', err);
      return null;
    }
  }, [map, isLoaded]);

  const removeMarker = useCallback((id) => {
    const marker = markersRef.current.get(id);
    const popup = popupsRef.current.get(id);

    if (marker) {
      marker.remove();
      markersRef.current.delete(id);
    }

    if (popup) {
      popup.remove();
      popupsRef.current.delete(id);
    }
  }, []);

  const updateMarker = useCallback((id, coordinates, options = {}) => {
    const marker = markersRef.current.get(id);
    
    if (marker) {
      marker.setLngLat(coordinates);
      
      // Update marker style if provided
      if (options.color || options.size) {
        const el = marker.getElement();
        if (options.color) {
          el.style.backgroundColor = options.color;
        }
        if (options.size) {
          const size = options.size === 'small' ? '20px' : options.size === 'large' ? '40px' : '30px';
          el.style.width = size;
          el.style.height = size;
        }
      }
    }
  }, []);

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((marker) => marker.remove());
    popupsRef.current.forEach((popup) => popup.remove());
    markersRef.current.clear();
    popupsRef.current.clear();
  }, []);

  // ============================================
  // MAP CONTROLS
  // ============================================

  const flyTo = useCallback((coordinates, zoom = null, options = {}) => {
    if (!map) return;

    map.flyTo({
      center: coordinates,
      zoom: zoom || map.getZoom(),
      ...options
    });
  }, [map]);

  const panTo = useCallback((coordinates) => {
    if (!map) return;
    map.panTo(coordinates);
  }, [map]);

  const fitBounds = useCallback((bounds, options = {}) => {
    if (!map) return;
    
    const defaultOptions = {
      padding: 50,
      maxZoom: 15,
      ...options
    };

    map.fitBounds(bounds, defaultOptions);
  }, [map]);

  const setCenter = useCallback((coordinates) => {
    if (!map) return;
    map.setCenter(coordinates);
  }, [map]);

  const setZoom = useCallback((zoom) => {
    if (!map) return;
    map.setZoom(zoom);
  }, [map]);

  // ============================================
  // SOURCE AND LAYER MANAGEMENT
  // ============================================

  const addSource = useCallback((id, source) => {
    if (!map || !isLoaded) return;

    try {
      if (!map.getSource(id)) {
        map.addSource(id, source);
      }
    } catch (err) {
      console.error('Error adding source:', err);
    }
  }, [map, isLoaded]);

  const removeSource = useCallback((id) => {
    if (!map) return;

    try {
      if (map.getSource(id)) {
        map.removeSource(id);
      }
    } catch (err) {
      console.error('Error removing source:', err);
    }
  }, [map]);

  const addLayer = useCallback((layer) => {
    if (!map || !isLoaded) return;

    try {
      if (!map.getLayer(layer.id)) {
        map.addLayer(layer);
      }
    } catch (err) {
      console.error('Error adding layer:', err);
    }
  }, [map, isLoaded]);

  const removeLayer = useCallback((id) => {
    if (!map) return;

    try {
      if (map.getLayer(id)) {
        map.removeLayer(id);
      }
    } catch (err) {
      console.error('Error removing layer:', err);
    }
  }, [map]);

  // ============================================
  // EVENT HANDLING
  // ============================================

  const onClick = useCallback((handler) => {
    if (!map) return;
    map.on('click', handler);
    
    // Return cleanup function
    return () => map.off('click', handler);
  }, [map]);

  const onMove = useCallback((handler) => {
    if (!map) return;
    map.on('move', handler);
    
    return () => map.off('move', handler);
  }, [map]);

  const onZoom = useCallback((handler) => {
    if (!map) return;
    map.on('zoom', handler);
    
    return () => map.off('zoom', handler);
  }, [map]);

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  const getCenter = useCallback(() => {
    if (!map) return null;
    return map.getCenter();
  }, [map]);

  const getZoom = useCallback(() => {
    if (!map) return null;
    return map.getZoom();
  }, [map]);

  const getBounds = useCallback(() => {
    if (!map) return null;
    return map.getBounds();
  }, [map]);

  const project = useCallback((coordinates) => {
    if (!map) return null;
    return map.project(coordinates);
  }, [map]);

  const unproject = useCallback((point) => {
    if (!map) return null;
    return map.unproject(point);
  }, [map]);

  // ============================================
  // CLEANUP
  // ============================================

  useEffect(() => {
    return () => {
      clearMarkers();
    };
  }, [clearMarkers]);

  // ============================================
  // RETURN HOOK API
  // ============================================

  return {
    // Map instance
    map,
    isLoaded,
    error,

    // Marker management
    addMarker,
    removeMarker,
    updateMarker,
    clearMarkers,

    // Map controls
    flyTo,
    panTo,
    fitBounds,
    setCenter,
    setZoom,

    // Source and layer management
    addSource,
    removeSource,
    addLayer,
    removeLayer,

    // Event handling
    onClick,
    onMove,
    onZoom,

    // Utility functions
    getCenter,
    getZoom,
    getBounds,
    project,
    unproject
  };
};

export default useMapbox;