// caffis-map-service/backend/src/routes/mapRoutes.js
const express = require('express');
const router = express.Router();
const mapController = require('../controllers/mapController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// ============================================
// USER LOCATION ROUTES
// ============================================

// Update current location
router.put('/location', mapController.updateLocation);

// Get current location
router.get('/location', mapController.getCurrentLocation);

// Toggle availability
router.patch('/availability', mapController.toggleAvailability);

// Clear location
router.delete('/location', mapController.clearLocation);

// ============================================
// NEARBY USERS ROUTES
// ============================================

// Get nearby users
router.get('/users/nearby', mapController.getNearbyUsers);

// Get active users count by city
router.get('/users/count/:city', mapController.getActiveUsersCount);

// ============================================
// COFFEE SHOPS ROUTES
// ============================================

// Get coffee shops
router.get('/coffee-shops', mapController.getCoffeeShops);

// Get coffee shop details
router.get('/coffee-shops/:shopId', mapController.getCoffeeShopDetails);

// ============================================
// INVITE ROUTES
// ============================================

// Send coffee invite
router.post('/invite', mapController.sendCoffeeInvite);

// ============================================
// UTILITY ROUTES
// ============================================

// Get map service statistics
router.get('/stats', mapController.getMapStats);

module.exports = router;