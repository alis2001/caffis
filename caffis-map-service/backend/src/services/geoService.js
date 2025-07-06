// caffis-map-service/backend/src/services/geoService.js
const geolib = require('geolib');
const logger = require('../utils/logger');

class GeoService {
  constructor() {
    // Italian cities with their coordinates for reference
    this.italianCities = {
      'torino': { latitude: 45.0703, longitude: 7.6869, name: 'Torino' },
      'milano': { latitude: 45.4642, longitude: 9.1900, name: 'Milano' },
      'roma': { latitude: 41.9028, longitude: 12.4964, name: 'Roma' },
      'napoli': { latitude: 40.8518, longitude: 14.2681, name: 'Napoli' },
      'firenze': { latitude: 43.7696, longitude: 11.2558, name: 'Firenze' },
      'bologna': { latitude: 44.4949, longitude: 11.3426, name: 'Bologna' },
      'venezia': { latitude: 45.4408, longitude: 12.3155, name: 'Venezia' },
      'genova': { latitude: 44.4056, longitude: 8.9463, name: 'Genova' },
      'palermo': { latitude: 38.1157, longitude: 13.3615, name: 'Palermo' },
      'bari': { latitude: 41.1177, longitude: 16.8512, name: 'Bari' }
    };
  }

  // ============================================
  // DISTANCE CALCULATIONS
  // ============================================

  /**
   * Calculate distance between two points in meters
   * @param {number} lat1 - Latitude of first point
   * @param {number} lon1 - Longitude of first point
   * @param {number} lat2 - Latitude of second point
   * @param {number} lon2 - Longitude of second point
   * @returns {number} Distance in meters
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    try {
      return geolib.getDistance(
        { latitude: lat1, longitude: lon1 },
        { latitude: lat2, longitude: lon2 }
      );
    } catch (error) {
      logger.error('Error calculating distance:', error);
      return Infinity;
    }
  }

  /**
   * Calculate bearing between two points
   * @param {number} lat1 - Latitude of first point
   * @param {number} lon1 - Longitude of first point
   * @param {number} lat2 - Latitude of second point
   * @param {number} lon2 - Longitude of second point
   * @returns {number} Bearing in degrees
   */
  calculateBearing(lat1, lon1, lat2, lon2) {
    try {
      return geolib.getBearing(
        { latitude: lat1, longitude: lon1 },
        { latitude: lat2, longitude: lon2 }
      );
    } catch (error) {
      logger.error('Error calculating bearing:', error);
      return 0;
    }
  }

  // ============================================
  // CITY DETECTION
  // ============================================

  /**
   * Determine which Italian city the coordinates are closest to
   * @param {number} latitude - User's latitude
   * @param {number} longitude - User's longitude
   * @returns {string} City name
   */
  detectCity(latitude, longitude) {
    try {
      let closestCity = 'torino'; // Default
      let minDistance = Infinity;

      for (const [cityKey, cityData] of Object.entries(this.italianCities)) {
        const distance = this.calculateDistance(
          latitude, longitude,
          cityData.latitude, cityData.longitude
        );

        if (distance < minDistance) {
          minDistance = distance;
          closestCity = cityKey;
        }
      }

      // If user is more than 50km from any major city, still assign closest
      if (minDistance > 50000) {
        logger.info(`User location is ${Math.round(minDistance/1000)}km from nearest city (${closestCity})`);
      }

      return closestCity;
    } catch (error) {
      logger.error('Error detecting city:', error);
      return 'torino'; // Default fallback
    }
  }

  /**
   * Get city information by key
   * @param {string} cityKey - City key (e.g., 'torino', 'milano')
   * @returns {object|null} City data object
   */
  getCityInfo(cityKey) {
    return this.italianCities[cityKey.toLowerCase()] || null;
  }

  /**
   * Get all supported cities
   * @returns {object} All cities data
   */
  getAllCities() {
    return this.italianCities;
  }

  // ============================================
  // GEOFENCING
  // ============================================

  /**
   * Check if coordinate is within a circular area
   * @param {number} lat - Point latitude
   * @param {number} lon - Point longitude
   * @param {number} centerLat - Center latitude
   * @param {number} centerLon - Center longitude
   * @param {number} radius - Radius in meters
   * @returns {boolean} True if point is within radius
   */
  isWithinRadius(lat, lon, centerLat, centerLon, radius) {
    try {
      const distance = this.calculateDistance(lat, lon, centerLat, centerLon);
      return distance <= radius;
    } catch (error) {
      logger.error('Error checking radius:', error);
      return false;
    }
  }

  /**
   * Check if coordinate is within city boundaries (simplified)
   * @param {number} latitude - Point latitude
   * @param {number} longitude - Point longitude
   * @param {string} cityKey - City to check against
   * @param {number} cityRadius - City radius in meters (default 20km)
   * @returns {boolean} True if within city
   */
  isWithinCity(latitude, longitude, cityKey, cityRadius = 20000) {
    const cityInfo = this.getCityInfo(cityKey);
    if (!cityInfo) return false;

    return this.isWithinRadius(
      latitude, longitude,
      cityInfo.latitude, cityInfo.longitude,
      cityRadius
    );
  }

  // ============================================
  // USER CLUSTERING
  // ============================================

  /**
   * Group users by proximity clusters
   * @param {Array} users - Array of user objects with latitude/longitude
   * @param {number} clusterRadius - Maximum distance between users in same cluster (meters)
   * @returns {Array} Array of user clusters
   */
  clusterUsersByProximity(users, clusterRadius = 500) {
    try {
      const clusters = [];
      const processedUsers = new Set();

      for (const user of users) {
        if (processedUsers.has(user.userId)) continue;

        const cluster = [user];
        processedUsers.add(user.userId);

        // Find other users within cluster radius
        for (const otherUser of users) {
          if (processedUsers.has(otherUser.userId)) continue;

          const distance = this.calculateDistance(
            user.latitude, user.longitude,
            otherUser.latitude, otherUser.longitude
          );

          if (distance <= clusterRadius) {
            cluster.push(otherUser);
            processedUsers.add(otherUser.userId);
          }
        }

        clusters.push({
          id: `cluster_${clusters.length + 1}`,
          centerLat: cluster.reduce((sum, u) => sum + u.latitude, 0) / cluster.length,
          centerLon: cluster.reduce((sum, u) => sum + u.longitude, 0) / cluster.length,
          users: cluster,
          count: cluster.length
        });
      }

      return clusters;
    } catch (error) {
      logger.error('Error clustering users:', error);
      return [];
    }
  }

  // ============================================
  // COFFEE SHOP RECOMMENDATIONS
  // ============================================

  /**
   * Find nearest coffee shops to a location
   * @param {number} latitude - User latitude
   * @param {number} longitude - User longitude
   * @param {Array} coffeeShops - Array of coffee shop objects
   * @param {number} maxDistance - Maximum distance in meters
   * @param {number} limit - Maximum number of results
   * @returns {Array} Sorted array of nearby coffee shops with distances
   */
  findNearbyCoffeeShops(latitude, longitude, coffeeShops, maxDistance = 2000, limit = 10) {
    try {
      const shopsWithDistance = coffeeShops
        .map(shop => {
          const distance = this.calculateDistance(
            latitude, longitude,
            shop.latitude, shop.longitude
          );

          return {
            ...shop,
            distance: distance,
            walkingTimeMinutes: Math.round(distance / 80) // Approximate walking speed 80m/min
          };
        })
        .filter(shop => shop.distance <= maxDistance)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit);

      return shopsWithDistance;
    } catch (error) {
      logger.error('Error finding nearby coffee shops:', error);
      return [];
    }
  }

  /**
   * Find coffee shops that are roughly equidistant between two users
   * @param {number} lat1 - First user latitude
   * @param {number} lon1 - First user longitude
   * @param {number} lat2 - Second user latitude
   * @param {number} lon2 - Second user longitude
   * @param {Array} coffeeShops - Array of coffee shop objects
   * @returns {Array} Coffee shops near the midpoint
   */
  findMidpointCoffeeShops(lat1, lon1, lat2, lon2, coffeeShops) {
    try {
      // Calculate midpoint between two users
      const midpoint = geolib.getCenter([
        { latitude: lat1, longitude: lon1 },
        { latitude: lat2, longitude: lon2 }
      ]);

      if (!midpoint) {
        return [];
      }

      // Find coffee shops near the midpoint
      const maxDistanceFromMidpoint = Math.min(
        this.calculateDistance(lat1, lon1, lat2, lon2) / 3, // 1/3 of distance between users
        1000 // Max 1km from midpoint
      );

      return this.findNearbyCoffeeShops(
        midpoint.latitude,
        midpoint.longitude,
        coffeeShops,
        maxDistanceFromMidpoint,
        5
      );
    } catch (error) {
      logger.error('Error finding midpoint coffee shops:', error);
      return [];
    }
  }

  // ============================================
  // VALIDATION
  // ============================================

  /**
   * Validate latitude/longitude coordinates
   * @param {number} latitude - Latitude to validate
   * @param {number} longitude - Longitude to validate
   * @returns {boolean} True if valid coordinates
   */
  isValidCoordinate(latitude, longitude) {
    return (
      typeof latitude === 'number' &&
      typeof longitude === 'number' &&
      latitude >= -90 && latitude <= 90 &&
      longitude >= -180 && longitude <= 180 &&
      !isNaN(latitude) && !isNaN(longitude)
    );
  }

  /**
   * Check if coordinates are within Italy (approximately)
   * @param {number} latitude - Latitude to check
   * @param {number} longitude - Longitude to check
   * @returns {boolean} True if roughly within Italy
   */
  isWithinItaly(latitude, longitude) {
    // Approximate bounding box for Italy
    const italyBounds = {
      north: 47.1,
      south: 36.0,
      east: 18.8,
      west: 6.6
    };

    return (
      latitude >= italyBounds.south &&
      latitude <= italyBounds.north &&
      longitude >= italyBounds.west &&
      longitude <= italyBounds.east
    );
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Format distance for display
   * @param {number} distanceMeters - Distance in meters
   * @returns {string} Formatted distance string
   */
  formatDistance(distanceMeters) {
    if (distanceMeters < 1000) {
      return `${Math.round(distanceMeters)}m`;
    } else {
      return `${(distanceMeters / 1000).toFixed(1)}km`;
    }
  }

  /**
   * Get compass direction from bearing
   * @param {number} bearing - Bearing in degrees
   * @returns {string} Compass direction (N, NE, E, etc.)
   */
  getCompassDirection(bearing) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(bearing / 45) % 8;
    return directions[index];
  }

  /**
   * Generate random coordinates within a city
   * @param {string} cityKey - City to generate coordinates for
   * @param {number} radiusKm - Radius in kilometers
   * @returns {object} Random coordinates object
   */
  generateRandomCityCoordinates(cityKey, radiusKm = 5) {
    const cityInfo = this.getCityInfo(cityKey);
    if (!cityInfo) return null;

    // Generate random point within radius
    const randomPoint = geolib.computeDestinationPoint(
      { latitude: cityInfo.latitude, longitude: cityInfo.longitude },
      Math.random() * radiusKm * 1000, // Random distance up to radius
      Math.random() * 360 // Random bearing
    );

    return {
      latitude: randomPoint.latitude,
      longitude: randomPoint.longitude,
      city: cityKey
    };
  }
}

module.exports = new GeoService();