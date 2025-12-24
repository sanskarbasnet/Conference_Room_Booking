const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { verifyToken, authorize } = require('../middleware/auth');
const { locationValidation } = require('../middleware/validators');

// Public routes (no authentication required)
router.get('/locations', locationController.getAllLocations);
router.get('/locations/:id', locationController.getLocationById);

// Protected routes (admin only)
router.post(
  '/locations',
  verifyToken,
  authorize('admin'),
  locationValidation,
  locationController.createLocation
);

router.put(
  '/locations/:id',
  verifyToken,
  authorize('admin'),
  locationController.updateLocation
);

router.delete(
  '/locations/:id',
  verifyToken,
  authorize('admin'),
  locationController.deleteLocation
);

module.exports = router;

