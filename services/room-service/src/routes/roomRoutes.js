const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { verifyToken, authorize } = require('../middleware/auth');
const { roomValidation } = require('../middleware/validators');

// Public routes (no authentication required)
router.get('/rooms', roomController.getAllRooms);
router.get('/rooms/:id', roomController.getRoomById);
router.get('/rooms/location/:locationId', roomController.getRoomsByLocation);

// Protected routes (admin only)
router.post(
  '/rooms',
  verifyToken,
  authorize('admin'),
  roomValidation,
  roomController.createRoom
);

router.put(
  '/rooms/:id',
  verifyToken,
  authorize('admin'),
  roomController.updateRoom
);

router.delete(
  '/rooms/:id',
  verifyToken,
  authorize('admin'),
  roomController.deleteRoom
);

module.exports = router;

