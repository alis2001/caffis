// caffis-map-service/frontend/src/services/mapApi.js
import axios from 'axios';

class MapAPI {
  constructor() {
    this.baseURL = process.env.REACT_APP_MAP_API_URL || 'http://localhost:5001/api/map';
    this.timeout = 10000; // 10 seconds
    
    // Create axios instance
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add request interceptor for auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        console.error('API Error:', error);
        
        if (error.response?.status === 401) {
          // Handle unauthorized - token might be expired
          console.warn('Authentication failed - token might be expired');
        }
        
        return Promise.reject(error.response?.data || error.message);
      }
    );
  }

  // ============================================
  // AUTHENTICATION
  // ============================================

  setAuthToken(token) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('caffis_map_token', token);
    }
  }

  getAuthToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('caffis_map_token');
    }
    return null;
  }

  clearAuthToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('caffis_map_token');
    }
  }

  // ============================================
  // LOCATION ENDPOINTS
  // ============================================

  /**
   * Update user's current location
   */
  async updateLocation(latitude, longitude, city, isAvailable = true) {
    try {
      const response = await this.client.put('/location', {
        latitude,
        longitude,
        city,
        isAvailable
      });
      return response;
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  }

  /**
   * Get user's current location
   */
  async getCurrentLocation() {
    try {
      const response = await this.client.get('/location');
      return response;
    } catch (error) {
      console.error('Error getting current location:', error);
      throw error;
    }
  }

  /**
   * Toggle user availability
   */
  async toggleAvailability(isAvailable) {
    try {
      const response = await this.client.patch('/availability', {
        isAvailable
      });
      return response;
    } catch (error) {
      console.error('Error toggling availability:', error);
      throw error;
    }
  }

  /**
   * Clear user's location
   */
  async clearLocation() {
    try {
      const response = await this.client.delete('/location');
      return response;
    } catch (error) {
      console.error('Error clearing location:', error);
      throw error;
    }
  }

  // ============================================
  // NEARBY USERS ENDPOINTS
  // ============================================

  /**
   * Get nearby users
   */
  async getNearbyUsers({ city, radius = 5000, availableOnly = true, includeProfiles = false }) {
    try {
      const params = {
        city,
        radius,
        availableOnly,
        includeProfiles
      };

      const response = await this.client.get('/users/nearby', { params });
      return response;
    } catch (error) {
      console.error('Error getting nearby users:', error);
      throw error;
    }
  }

  /**
   * Get active users count by city
   */
  async getActiveUsersCount(city) {
    try {
      const response = await this.client.get(`/users/count/${city}`);
      return response;
    } catch (error) {
      console.error('Error getting active users count:', error);
      throw error;
    }
  }

  // ============================================
  // COFFEE SHOPS ENDPOINTS
  // ============================================

  /**
   * Get coffee shops
   */
  async getCoffeeShops({ city, latitude, longitude, radius = 2000, useCache = true }) {
    try {
      const params = {
        city,
        latitude,
        longitude,
        radius,
        useCache
      };

      const response = await this.client.get('/coffee-shops', { params });
      return response;
    } catch (error) {
      console.error('Error getting coffee shops:', error);
      throw error;
    }
  }

  /**
   * Get coffee shop details
   */
  async getCoffeeShopDetails(shopId) {
    try {
      const response = await this.client.get(`/coffee-shops/${shopId}`);
      return response;
    } catch (error) {
      console.error('Error getting coffee shop details:', error);
      throw error;
    }
  }

  // ============================================
  // INVITE ENDPOINTS
  // ============================================

  /**
   * Send coffee invite
   */
  /**
   * Get Naples venues with Google Places data
   */
  async getNaplesVenues() {
    try {
      const response = await this.client.get('/venues/naples', {
        params: {
          includeGoogleData: true,
          useCache: true
        }
      });
      return response;
    } catch (error) {
      console.error('Error getting Naples venues:', error);
      throw error;
    }
  }

  /**
   * Get venue details by ID
   */
  async getVenueDetails(venueId) {
    try {
      const response = await this.client.get(`/venues/${venueId}/details`);
      return response;
    } catch (error) {
      console.error('Error getting venue details:', error);
      throw error;
    }
  }

  /**
   * Search venues by location
   */
  async searchVenues({ latitude, longitude, radius = 2000, type = 'cafe' }) {
    try {
      const params = { latitude, longitude, radius, type };
      const response = await this.client.get('/venues/search', { params });
      return response;
    } catch (error) {
      console.error('Error searching venues:', error);
      throw error;
    }
  }

  /**
   * Mark venue as visited
   */
  async visitVenue(venueId) {
    try {
      const response = await this.client.post(`/venues/${venueId}/visit`);
      return response;
    } catch (error) {
      console.error('Error marking venue as visited:', error);
      throw error;
    }
  }
  
  async sendCoffeeInvite({ toUserId, message, coffeeShopId, proposedTime, location }) {
    try {
      const response = await this.client.post('/invite', {
        toUserId,
        message,
        coffeeShopId,
        proposedTime,
        location
      });
      return response;
    } catch (error) {
      console.error('Error sending coffee invite:', error);
      throw error;
    }
  }

  // ============================================
  // UTILITY ENDPOINTS
  // ============================================

  /**
   * Get map service statistics
   */
  async getMapStats() {
    try {
      const response = await this.client.get('/stats');
      return response;
    } catch (error) {
      console.error('Error getting map stats:', error);
      throw error;
    }
  }

  // ============================================
  // HEALTH CHECK
  // ============================================

  /**
   * Check map service health
   */
  async healthCheck() {
    try {
      // Use direct axios call to avoid auth interceptor
      const response = await axios.get(`${this.baseURL.replace('/api/map', '')}/health`, {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Check if API is available
   */
  async isAvailable() {
    try {
      await this.healthCheck();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get API configuration
   */
  getConfig() {
    return {
      baseURL: this.baseURL,
      timeout: this.timeout,
      hasAuthToken: !!this.getAuthToken()
    };
  }

  /**
   * Update base URL (useful for environment changes)
   */
  setBaseURL(url) {
    this.baseURL = url;
    this.client.defaults.baseURL = url;
  }
}

// Create and export singleton instance
const mapAPI = new MapAPI();

export default mapAPI;