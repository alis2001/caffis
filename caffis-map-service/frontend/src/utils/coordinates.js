// caffis-map-service/frontend/src/utils/coordinates.js

/**
 * Utility functions for handling coordinates and geographic calculations
 */

// Italian cities with their coordinates
export const ITALIAN_CITIES = {
  torino: { latitude: 45.0703, longitude: 7.6869, name: 'Torino', radius: 50 },
  milano: { latitude: 45.4642, longitude: 9.1900, name: 'Milano', radius: 50 },
  roma: { latitude: 41.9028, longitude: 12.4964, name: 'Roma', radius: 50 },
  napoli: { latitude: 40.8518, longitude: 14.2681, name: 'Napoli', radius: 40 },
  firenze: { latitude: 43.7696, longitude: 11.2558, name: 'Firenze', radius: 30 },
  bologna: { latitude: 44.4949, longitude: 11.3426, name: 'Bologna', radius: 30 },
  venezia: { latitude: 45.4408, longitude: 12.3155, name: 'Venezia', radius: 30 },
  genova: { latitude: 44.4056, longitude: 8.9463, name: 'Genova', radius: 30 },
  palermo: { latitude: 38.1157, longitude: 13.3615, name: 'Palermo', radius: 30 },
  bari: { latitude: 41.1177, longitude: 16.8512, name: 'Bari', radius: 25 },
  catania: { latitude: 37.5079, longitude: 15.0830, name: 'Catania', radius: 25 },
  verona: { latitude: 45.4384, longitude: 10.9916, name: 'Verona', radius: 20 },
  padova: { latitude: 45.4064, longitude: 11.8768, name: 'Padova', radius: 20 },
  trieste: { latitude: 45.6495, longitude: 13.7768, name: 'Trieste', radius: 15 }
};

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in meters
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

/**
 * Calculate bearing between two points
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Bearing in degrees
 */
export const calculateBearing = (lat1, lon1, lat2, lon2) => {
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);

  return (θ * 180 / Math.PI + 360) % 360;
};

/**
 * Validate if coordinates are valid
 * @param {number} latitude - Latitude to validate
 * @param {number} longitude - Longitude to validate
 * @returns {boolean} True if coordinates are valid
 */
export const isValidCoordinate = (latitude, longitude) => {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
};

/**
 * Check if coordinates are within Italian bounds
 * @param {number} latitude - Latitude to check
 * @param {number} longitude - Longitude to check
 * @returns {boolean} True if within Italian bounds
 */
export const isWithinItalianBounds = (latitude, longitude) => {
  if (!isValidCoordinate(latitude, longitude)) {
    return false;
  }

  // Italy rough bounds
  const bounds = {
    north: 47.1,
    south: 35.5,
    east: 18.8,
    west: 6.6
  };

  return (
    latitude >= bounds.south &&
    latitude <= bounds.north &&
    longitude >= bounds.west &&
    longitude <= bounds.east
  );
};

/**
 * Detect city from coordinates
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @returns {string|null} City key or null if not found
 */
export const detectCityFromCoordinates = (latitude, longitude) => {
  if (!isValidCoordinate(latitude, longitude)) {
    return null;
  }

  let closestCity = null;
  let minDistance = Infinity;

  for (const [cityKey, cityData] of Object.entries(ITALIAN_CITIES)) {
    const distance = calculateDistance(
      latitude, 
      longitude, 
      cityData.latitude, 
      cityData.longitude
    );

    if (distance < minDistance && distance <= cityData.radius * 1000) {
      minDistance = distance;
      closestCity = cityKey;
    }
  }

  return closestCity || 'torino'; // Default to Turin
};

/**
 * Get city information by key
 * @param {string} cityKey - City key
 * @returns {object|null} City information or null
 */
export const getCityInfo = (cityKey) => {
  return ITALIAN_CITIES[cityKey?.toLowerCase()] || null;
};

/**
 * Get all available cities
 * @returns {Array} Array of city objects
 */
export const getAllCities = () => {
  return Object.entries(ITALIAN_CITIES).map(([key, data]) => ({
    key,
    ...data
  }));
};

/**
 * Format distance for display
 * @param {number} distance - Distance in meters
 * @returns {string} Formatted distance string
 */
export const formatDistance = (distance) => {
  if (distance < 1000) {
    return `${Math.round(distance)}m`;
  } else if (distance < 10000) {
    return `${(distance / 1000).toFixed(1)}km`;
  } else {
    return `${Math.round(distance / 1000)}km`;
  }
};

/**
 * Get center point from multiple coordinates
 * @param {Array} coordinates - Array of [longitude, latitude] pairs
 * @returns {Array|null} Center point [longitude, latitude] or null
 */
export const getCenterPoint = (coordinates) => {
  if (!coordinates || coordinates.length === 0) {
    return null;
  }

  if (coordinates.length === 1) {
    return coordinates[0];
  }

  let x = 0;
  let y = 0;
  let z = 0;

  for (const [lng, lat] of coordinates) {
    const φ = lat * Math.PI / 180;
    const λ = lng * Math.PI / 180;

    x += Math.cos(φ) * Math.cos(λ);
    y += Math.cos(φ) * Math.sin(λ);
    z += Math.sin(φ);
  }

  const total = coordinates.length;
  x = x / total;
  y = y / total;
  z = z / total;

  const λ = Math.atan2(y, x);
  const hyp = Math.sqrt(x * x + y * y);
  const φ = Math.atan2(z, hyp);

  return [λ * 180 / Math.PI, φ * 180 / Math.PI];
};

/**
 * Calculate bounding box from coordinates with padding
 * @param {Array} coordinates - Array of [longitude, latitude] pairs
 * @param {number} padding - Padding factor (default: 0.01)
 * @returns {Array|null} Bounding box [west, south, east, north] or null
 */
export const getBoundingBox = (coordinates, padding = 0.01) => {
  if (!coordinates || coordinates.length === 0) {
    return null;
  }

  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;

  for (const [lng, lat] of coordinates) {
    west = Math.min(west, lng);
    south = Math.min(south, lat);
    east = Math.max(east, lng);
    north = Math.max(north, lat);
  }

  // Add padding
  const lngPadding = (east - west) * padding;
  const latPadding = (north - south) * padding;

  return [
    west - lngPadding,
    south - latPadding,
    east + lngPadding,
    north + latPadding
  ];
};

/**
 * Check if point is within radius of center point
 * @param {number} centerLat - Center latitude
 * @param {number} centerLng - Center longitude
 * @param {number} pointLat - Point latitude
 * @param {number} pointLng - Point longitude
 * @param {number} radiusMeters - Radius in meters
 * @returns {boolean} True if point is within radius
 */
export const isWithinRadius = (centerLat, centerLng, pointLat, pointLng, radiusMeters) => {
  const distance = calculateDistance(centerLat, centerLng, pointLat, pointLng);
  return distance <= radiusMeters;
};

/**
 * Generate random coordinates within a radius of a center point
 * @param {number} centerLat - Center latitude
 * @param {number} centerLng - Center longitude
 * @param {number} radiusMeters - Radius in meters
 * @returns {Array} Random coordinates [longitude, latitude]
 */
export const generateRandomCoordinatesInRadius = (centerLat, centerLng, radiusMeters) => {
  const R = 6371000; // Earth's radius in meters
  
  // Random distance and angle
  const distance = Math.random() * radiusMeters;
  const angle = Math.random() * 2 * Math.PI;
  
  // Convert to radians
  const φ1 = centerLat * Math.PI / 180;
  const λ1 = centerLng * Math.PI / 180;
  
  // Calculate new point
  const φ2 = Math.asin(
    Math.sin(φ1) * Math.cos(distance / R) +
    Math.cos(φ1) * Math.sin(distance / R) * Math.cos(angle)
  );
  
  const λ2 = λ1 + Math.atan2(
    Math.sin(angle) * Math.sin(distance / R) * Math.cos(φ1),
    Math.cos(distance / R) - Math.sin(φ1) * Math.sin(φ2)
  );
  
  return [λ2 * 180 / Math.PI, φ2 * 180 / Math.PI];
};

/**
 * Convert coordinates to different formats
 */
export const coordinateUtils = {
  /**
   * Convert decimal degrees to degrees, minutes, seconds
   * @param {number} decimal - Decimal degrees
   * @returns {object} DMS object {degrees, minutes, seconds, direction}
   */
  decimalToDMS: (decimal, isLongitude = false) => {
    const abs = Math.abs(decimal);
    const degrees = Math.floor(abs);
    const minutesFloat = (abs - degrees) * 60;
    const minutes = Math.floor(minutesFloat);
    const seconds = (minutesFloat - minutes) * 60;
    
    let direction;
    if (isLongitude) {
      direction = decimal >= 0 ? 'E' : 'W';
    } else {
      direction = decimal >= 0 ? 'N' : 'S';
    }
    
    return {
      degrees,
      minutes,
      seconds: Math.round(seconds * 100) / 100,
      direction
    };
  },

  /**
   * Convert DMS to decimal degrees
   * @param {number} degrees - Degrees
   * @param {number} minutes - Minutes
   * @param {number} seconds - Seconds
   * @param {string} direction - Direction (N, S, E, W)
   * @returns {number} Decimal degrees
   */
  dmsToDecimal: (degrees, minutes, seconds, direction) => {
    let decimal = degrees + minutes / 60 + seconds / 3600;
    if (direction === 'S' || direction === 'W') {
      decimal = -decimal;
    }
    return decimal;
  },

  /**
   * Format coordinates for display
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @param {string} format - Format ('decimal', 'dms')
   * @returns {string} Formatted coordinates
   */
  format: (latitude, longitude, format = 'decimal') => {
    if (!isValidCoordinate(latitude, longitude)) {
      return 'Invalid coordinates';
    }

    if (format === 'dms') {
      const lat = coordinateUtils.decimalToDMS(latitude, false);
      const lng = coordinateUtils.decimalToDMS(longitude, true);
      
      return `${lat.degrees}°${lat.minutes}'${lat.seconds}"${lat.direction} ${lng.degrees}°${lng.minutes}'${lng.seconds}"${lng.direction}`;
    }

    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }
};