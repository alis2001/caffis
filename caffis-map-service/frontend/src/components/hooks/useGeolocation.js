// caffis-map-service/frontend/src/hooks/useGeolocation.js
import { useState, useEffect, useCallback, useRef } from 'react';

const useGeolocation = (options = {}) => {
  // State
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState('prompt'); // 'prompt', 'granted', 'denied'

  // Refs
  const watchIdRef = useRef(null);
  const timeoutRef = useRef(null);

  // Default options
  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: 15000, // 15 seconds
    maximumAge: 300000, // 5 minutes
    ...options
  };

  // ============================================
  // GEOLOCATION FUNCTIONS
  // ============================================

  // Check if geolocation is supported
  const isSupported = 'geolocation' in navigator;

  // Detect city from coordinates (simple implementation)
  const detectCity = useCallback((latitude, longitude) => {
    // Italian cities with coordinates for basic detection
    const cities = [
      { name: 'torino', lat: 45.0703, lng: 7.6869, radius: 50 },
      { name: 'milano', lat: 45.4642, lng: 9.1900, radius: 50 },
      { name: 'roma', lat: 41.9028, lng: 12.4964, radius: 50 },
      { name: 'napoli', lat: 40.8518, lng: 14.2681, radius: 50 },
      { name: 'firenze', lat: 43.7696, lng: 11.2558, radius: 30 },
      { name: 'bologna', lat: 44.4949, lng: 11.3426, radius: 30 },
      { name: 'venezia', lat: 45.4408, lng: 12.3155, radius: 30 },
      { name: 'genova', lat: 44.4056, lng: 8.9463, radius: 30 }
    ];

    // Calculate distance using Haversine formula
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    // Find closest city
    let closestCity = 'torino'; // Default
    let minDistance = Infinity;

    for (const city of cities) {
      const distance = calculateDistance(latitude, longitude, city.lat, city.lng);
      if (distance < minDistance && distance <= city.radius) {
        minDistance = distance;
        closestCity = city.name;
      }
    }

    return closestCity;
  }, []);

  // Format location data
  const formatLocationData = useCallback((position) => {
    const { latitude, longitude, accuracy, altitude, heading, speed } = position.coords;
    const timestamp = position.timestamp;
    const city = detectCity(latitude, longitude);

    return {
      latitude,
      longitude,
      accuracy,
      altitude,
      heading,
      speed,
      timestamp,
      city,
      formattedTime: new Date(timestamp).toLocaleTimeString('it-IT')
    };
  }, [detectCity]);

  // Handle geolocation success
  const handleSuccess = useCallback((position) => {
    console.log('📍 Geolocation success:', position);
    
    const locationData = formatLocationData(position);
    setLocation(locationData);
    setError(null);
    setIsLoading(false);
    
    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [formatLocationData]);

  // Handle geolocation error
  const handleError = useCallback((err) => {
    console.error('📍 Geolocation error:', err);
    
    let errorMessage = 'Errore di geolocalizzazione';
    
    switch (err.code) {
      case err.PERMISSION_DENIED:
        errorMessage = 'Accesso alla posizione negato. Abilita la geolocalizzazione nelle impostazioni del browser.';
        setPermission('denied');
        break;
      case err.POSITION_UNAVAILABLE:
        errorMessage = 'Posizione non disponibile. Controlla la connessione GPS.';
        break;
      case err.TIMEOUT:
        errorMessage = 'Timeout della richiesta di posizione. Riprova.';
        break;
      default:
        errorMessage = `Errore di geolocalizzazione: ${err.message}`;
        break;
    }
    
    setError(errorMessage);
    setIsLoading(false);
    setLocation(null);
    
    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // ============================================
  // PUBLIC METHODS
  // ============================================

  // Request location once
  const requestLocation = useCallback(async () => {
    if (!isSupported) {
      setError('Geolocalizzazione non supportata dal browser');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check permission first
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        setPermission(permission.state);
        
        if (permission.state === 'denied') {
          throw new Error('Permesso di geolocalizzazione negato');
        }
      }

      // Set timeout for request
      timeoutRef.current = setTimeout(() => {
        setError('Timeout: impossibile ottenere la posizione');
        setIsLoading(false);
      }, defaultOptions.timeout);

      // Request current position
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            handleSuccess(position);
            resolve(formatLocationData(position));
          },
          (error) => {
            handleError(error);
            reject(error);
          },
          defaultOptions
        );
      });

    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      return null;
    }
  }, [isSupported, defaultOptions, handleSuccess, handleError, formatLocationData]);

  // Start watching position
  const startWatching = useCallback(() => {
    if (!isSupported) {
      setError('Geolocalizzazione non supportata dal browser');
      return;
    }

    if (watchIdRef.current) {
      console.log('📍 Already watching position');
      return;
    }

    console.log('📍 Starting position watch');
    setError(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        ...defaultOptions,
        enableHighAccuracy: true,
        maximumAge: 60000 // 1 minute for watching
      }
    );
  }, [isSupported, handleSuccess, handleError, defaultOptions]);

  // Stop watching position
  const stopWatching = useCallback(() => {
    if (watchIdRef.current) {
      console.log('📍 Stopping position watch');
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // Clear location data
  const clearLocation = useCallback(() => {
    setLocation(null);
    setError(null);
    stopWatching();
  }, [stopWatching]);

  // ============================================
  // PERMISSION MANAGEMENT
  // ============================================

  // Check permission status
  const checkPermission = useCallback(async () => {
    if (!navigator.permissions) {
      return 'prompt';
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      setPermission(permission.state);
      return permission.state;
    } catch (err) {
      console.error('Error checking geolocation permission:', err);
      return 'prompt';
    }
  }, []);

  // Request permission
  const requestPermission = useCallback(async () => {
    try {
      await requestLocation();
      return permission;
    } catch (err) {
      return 'denied';
    }
  }, [requestLocation, permission]);

  // ============================================
  // EFFECTS
  // ============================================

  // Check permission on mount
  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  // Listen for permission changes
  useEffect(() => {
    if (!navigator.permissions) return;

    let permissionStatus;

    const handlePermissionChange = () => {
      setPermission(permissionStatus.state);
      
      if (permissionStatus.state === 'denied') {
        setError('Accesso alla posizione negato');
        stopWatching();
      }
    };

    navigator.permissions.query({ name: 'geolocation' })
      .then((status) => {
        permissionStatus = status;
        status.addEventListener('change', handlePermissionChange);
      })
      .catch(console.error);

    return () => {
      if (permissionStatus) {
        permissionStatus.removeEventListener('change', handlePermissionChange);
      }
    };
  }, [stopWatching]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWatching();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [stopWatching]);

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  // Get distance from current location
  const getDistanceFrom = useCallback((latitude, longitude) => {
    if (!location) return null;

    const R = 6371e3; // Earth's radius in meters
    const φ1 = location.latitude * Math.PI / 180;
    const φ2 = latitude * Math.PI / 180;
    const Δφ = (latitude - location.latitude) * Math.PI / 180;
    const Δλ = (longitude - location.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }, [location]);

  // Format coordinates for display
  const formatCoordinates = useCallback((lat, lng, decimals = 4) => {
    if (typeof lat !== 'number' || typeof lng !== 'number') return null;
    
    return {
      latitude: lat.toFixed(decimals),
      longitude: lng.toFixed(decimals),
      formatted: `${lat.toFixed(decimals)}, ${lng.toFixed(decimals)}`
    };
  }, []);

  // ============================================
  // RETURN HOOK API
  // ============================================

  return {
    // State
    location,
    error,
    isLoading,
    permission,
    isSupported,
    
    // Methods
    requestLocation,
    startWatching,
    stopWatching,
    clearLocation,
    checkPermission,
    requestPermission,
    
    // Utilities
    getDistanceFrom,
    formatCoordinates,
    detectCity,
    
    // Status checks
    hasLocation: !!location,
    isWatching: !!watchIdRef.current,
    canRequest: isSupported && permission !== 'denied'
  };
};

export default useGeolocation;