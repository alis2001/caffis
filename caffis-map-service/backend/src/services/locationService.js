// caffis-map-service/backend/src/services/locationService.js
const axios = require('axios');
const logger = require('../utils/logger');
const geoService = require('./geoService');

class LocationService {
  constructor() {
    this.googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY;
    this.mainAppApiUrl = process.env.MAIN_APP_API_URL || 'http://localhost:5000/api';
  }

  // ============================================
  // GOOGLE PLACES API INTEGRATION
  // ============================================

  /**
   * Get coffee shops near a location using Google Places API
   */
  async getCoffeeShops(latitude, longitude, radius = 2000) {
    try {
      if (!this.googlePlacesApiKey) {
        logger.warn('Google Places API key not configured, using mock data');
        return this.getMockCoffeeShops(latitude, longitude);
      }

      const url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
      const params = {
        location: `${latitude},${longitude}`,
        radius: radius,
        type: 'cafe',
        key: this.googlePlacesApiKey
      };

      const response = await axios.get(url, { params });
      
      if (response.data.status === 'OK') {
        return this.formatGooglePlacesResults(response.data.results);
      } else {
        logger.error('Google Places API error:', response.data.status);
        return this.getMockCoffeeShops(latitude, longitude);
      }

    } catch (error) {
      logger.error('Error fetching coffee shops from Google Places:', error);
      return this.getMockCoffeeShops(latitude, longitude);
    }
  }

  /**
   * Format Google Places results to our standard format
   */
  formatGooglePlacesResults(places) {
    return places.map(place => ({
      id: place.place_id,
      name: place.name,
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
      rating: place.rating || 0,
      priceLevel: place.price_level || 2,
      address: place.vicinity,
      openNow: place.opening_hours?.open_now || null,
      photoUrl: place.photos?.[0] ? 
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${this.googlePlacesApiKey}` 
        : null,
      types: place.types || []
    }));
  }

  /**
   * Get detailed coffee shop information
   */
  async getCoffeeShopDetails(placeId) {
    try {
      if (!this.googlePlacesApiKey) {
        return null;
      }

      const url = 'https://maps.googleapis.com/maps/api/place/details/json';
      const params = {
        place_id: placeId,
        fields: 'name,rating,formatted_phone_number,opening_hours,website,reviews',
        key: this.googlePlacesApiKey
      };

      const response = await axios.get(url, { params });
      
      if (response.data.status === 'OK') {
        return response.data.result;
      }

      return null;
    } catch (error) {
      logger.error('Error fetching coffee shop details:', error);
      return null;
    }
  }

  // ============================================
  // GEOCODING SERVICES
  // ============================================

  /**
   * Get city name from coordinates
   */
  async getCityFromCoordinates(latitude, longitude) {
    try {
      if (!this.googlePlacesApiKey) {
        return geoService.getCityFromCoordinates(latitude, longitude);
      }

      const url = 'https://maps.googleapis.com/maps/api/geocode/json';
      const params = {
        latlng: `${latitude},${longitude}`,
        key: this.googlePlacesApiKey
      };

      const response = await axios.get(url, { params });
      
      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const result = response.data.results[0];
        
        // Find city component
        const cityComponent = result.address_components.find(component =>
          component.types.includes('locality') || 
          component.types.includes('administrative_area_level_2')
        );

        return cityComponent ? cityComponent.long_name.toLowerCase() : 'unknown';
      }

      return 'unknown';
    } catch (error) {
      logger.error('Error getting city from coordinates:', error);
      return 'unknown';
    }
  }

  /**
   * Get coordinates from city name
   */
  async getCoordinatesFromCity(cityName) {
    try {
      if (!this.googlePlacesApiKey) {
        return geoService.getCityInfo(cityName.toLowerCase());
      }

      const url = 'https://maps.googleapis.com/maps/api/geocode/json';
      const params = {
        address: cityName,
        key: this.googlePlacesApiKey
      };

      const response = await axios.get(url, { params });
      
      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const location = response.data.results[0].geometry.location;
        return {
          latitude: location.lat,
          longitude: location.lng,
          name: cityName
        };
      }

      return null;
    } catch (error) {
      logger.error('Error getting coordinates from city:', error);
      return null;
    }
  }

  // ============================================
  // MAIN APP INTEGRATION
  // ============================================

  /**
   * Get user profile from main app
   */
  async getUserProfile(userId, authToken) {
    try {
      const response = await axios.get(`${this.mainAppApiUrl}/user/profile/${userId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      return response.data;
    } catch (error) {
      logger.error('Error fetching user profile from main app:', error);
      return null;
    }
  }

  /**
   * Send invite notification to main app
   */
  async sendInviteNotification(fromUserId, toUserId, inviteData, authToken) {
    try {
      const payload = {
        fromUserId,
        toUserId,
        type: 'coffee_invite',
        data: inviteData
      };

      const response = await axios.post(`${this.mainAppApiUrl}/notifications/send`, payload, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      logger.info(`Invite notification sent: ${fromUserId} -> ${toUserId}`);
      return response.data;
    } catch (error) {
      logger.error('Error sending invite notification to main app:', error);
      return null;
    }
  }

  // ============================================
  // MOCK DATA (FOR DEVELOPMENT)
  // ============================================

  /**
   * Generate mock coffee shop data for development/testing
   */
  getMockCoffeeShops(latitude, longitude) {
    const cityInfo = geoService.getCityFromCoordinates(latitude, longitude);
    const cityName = cityInfo?.name || 'torino';

    const mockShops = {
      torino: [
        {
          id: 'mock_torino_1',
          name: 'Caffè Centrale',
          latitude: 45.0704 + (Math.random() - 0.5) * 0.02,
          longitude: 7.6862 + (Math.random() - 0.5) * 0.02,
          rating: 4.5,
          priceLevel: 2,
          address: 'Via Roma 1, Torino',
          openNow: true,
          photoUrl: null,
          types: ['cafe', 'restaurant']
        },
        {
          id: 'mock_torino_2',
          name: 'La Tazza d\'Oro',
          latitude: 45.0734 + (Math.random() - 0.5) * 0.02,
          longitude: 7.6831 + (Math.random() - 0.5) * 0.02,
          rating: 4.3,
          priceLevel: 1,
          address: 'Via Garibaldi 15, Torino',
          openNow: true,
          photoUrl: null,
          types: ['cafe']
        },
        {
          id: 'mock_torino_3',
          name: 'Bicerin',
          latitude: 45.0705 + (Math.random() - 0.5) * 0.02,
          longitude: 7.6888 + (Math.random() - 0.5) * 0.02,
          rating: 4.7,
          priceLevel: 3,
          address: 'Piazza della Consolata 5, Torino',
          openNow: false,
          photoUrl: null,
          types: ['cafe', 'historic']
        }
      ],
      milano: [
        {
          id: 'mock_milano_1',
          name: 'Caffè Centrale Milano',
          latitude: 45.4642 + (Math.random() - 0.5) * 0.02,
          longitude: 9.1900 + (Math.random() - 0.5) * 0.02,
          rating: 4.4,
          priceLevel: 3,
          address: 'Corso Buenos Aires 12, Milano',
          openNow: true,
          photoUrl: null,
          types: ['cafe', 'restaurant']
        }
      ]
    };

    const shops = mockShops[cityName] || mockShops.torino;
    
    // Filter by distance if provided
    return shops.filter(shop => {
      const distance = geoService.calculateDistance(
        latitude, longitude, shop.latitude, shop.longitude
      );
      return distance <= 3000; // 3km radius
    });
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Check if external services are available
   */
  async checkExternalServices() {
    const status = {
      googlePlaces: false,
      mainApp: false
    };

    // Check Google Places API
    if (this.googlePlacesApiKey) {
      try {
        const testUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
        const testParams = {
          location: '45.0703,7.6869',
          radius: 100,
          type: 'cafe',
          key: this.googlePlacesApiKey
        };
        
        const response = await axios.get(testUrl, { 
          params: testParams, 
          timeout: 3000 
        });
        
        status.googlePlaces = response.data.status === 'OK' || response.data.status === 'ZERO_RESULTS';
      } catch (error) {
        logger.warn('Google Places API check failed:', error.message);
      }
    }

    // Check Main App API
    try {
      const response = await axios.get(`${this.mainAppApiUrl}/health`, {
        timeout: 3000
      });
      status.mainApp = response.status === 200;
    } catch (error) {
      logger.warn('Main App API check failed:', error.message);
    }

    return status;
  }

  /**
   * Get service configuration
   */
  getConfig() {
    return {
      hasGooglePlacesKey: !!this.googlePlacesApiKey,
      mainAppApiUrl: this.mainAppApiUrl,
      mockMode: !this.googlePlacesApiKey
    };
  }
}

module.exports = new LocationService();