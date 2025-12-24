const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');
const { bookingValidation } = require('../middleware/validators');

// All booking routes require authentication
router.use(protect);

// Create booking (authenticated users)
router.post('/bookings', bookingValidation, bookingController.createBooking);

// Get user's own bookings
router.get('/bookings/user/:userId', bookingController.getUserBookings);

// Get specific booking
router.get('/bookings/:id', bookingController.getBookingById);

// Cancel booking
router.delete('/bookings/:id', bookingController.cancelBooking);

// Check room availability
router.get('/bookings/room/:roomId/availability', bookingController.checkRoomAvailability);

// Admin only: Get all bookings
router.get('/bookings', authorize('admin'), bookingController.getAllBookings);

module.exports = router;

