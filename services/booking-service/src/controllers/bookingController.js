const Booking = require('../models/Booking');
const { validationResult } = require('express-validator');
const { validateRoom } = require('../services/roomService');
const { getForecast } = require('../services/weatherService');
const { sendBookingConfirmation, sendCancellationNotification } = require('../services/notificationService');
const { calculateAdjustedPrice } = require('../utils/priceCalculator');

/**
 * POST /bookings
 * Create a new booking
 */
exports.createBooking = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: errors.array()
      });
    }

    const { roomId, date } = req.body;
    const user = req.user; // From auth middleware

    // 1. Validate date is in the future
    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (bookingDate < today) {
      return res.status(400).json({
        success: false,
        error: 'Booking date must be in the future'
      });
    }

    // 2. Validate room exists and is active
    const room = await validateRoom(roomId);

    // 3. Check room availability for the date
    const existingBooking = await Booking.findOne({
      roomId,
      bookingDate: date,
      status: { $in: ['confirmed', 'completed'] }
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        error: 'Room is already booked for this date',
        existingBooking: {
          id: existingBooking._id,
          date: existingBooking.bookingDate,
          status: existingBooking.status
        }
      });
    }

    // 4. Get weather forecast for the location and date
    const forecast = await getForecast(room.locationId._id, date);

    // 5. Calculate adjusted price
    const comfortableTemp = parseInt(process.env.COMFORTABLE_TEMPERATURE) || 21;
    const priceFactor = parseFloat(process.env.PRICE_ADJUSTMENT_FACTOR) || 0.05;
    
    const { deviation, adjustedPrice } = calculateAdjustedPrice(
      room.basePrice,
      forecast.temperature,
      comfortableTemp,
      priceFactor
    );

    // 6. Create booking
    const booking = new Booking({
      userId: user.id,
      roomId,
      bookingDate: date,
      basePrice: room.basePrice,
      temperature: forecast.temperature,
      deviation,
      adjustedPrice,
      status: 'confirmed',
      userEmail: user.email,
      userName: user.name,
      roomName: room.name,
      locationName: room.locationId.name
    });

    await booking.save();

    // 7. Send confirmation notification (non-blocking)
    sendBookingConfirmation({
      bookingId: booking._id,
      userEmail: user.email,
      userName: user.name,
      roomName: room.name,
      locationName: room.locationId.name,
      date,
      basePrice: room.basePrice,
      adjustedPrice,
      temperature: forecast.temperature,
      deviation
    }).catch(err => console.error('Notification error:', err));

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        booking: booking.toJSON(),
        priceBreakdown: {
          basePrice: room.basePrice,
          temperature: forecast.temperature,
          comfortableTemperature: comfortableTemp,
          deviation,
          adjustmentFactor: priceFactor,
          adjustedPrice
        }
      }
    });

  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create booking',
      message: error.message
    });
  }
};

/**
 * GET /bookings/user/:userId
 * Get all bookings for a specific user
 */
exports.getUserBookings = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;

    // Ensure user can only see their own bookings (unless admin)
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only view your own bookings.'
      });
    }

    // Build query
    const query = { userId };
    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query).sort({ bookingDate: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings.map(booking => booking.toJSON())
    });

  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bookings',
      message: error.message
    });
  }
};

/**
 * GET /bookings/:id
 * Get specific booking by ID
 */
exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Ensure user can only see their own bookings (unless admin)
    if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only view your own bookings.'
      });
    }

    res.status(200).json({
      success: true,
      data: booking.toJSON()
    });

  } catch (error) {
    console.error('Get booking error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid booking ID format'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking',
      message: error.message
    });
  }
};

/**
 * DELETE /bookings/:id
 * Cancel a booking
 */
exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Ensure user can only cancel their own bookings (unless admin)
    if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only cancel your own bookings.'
      });
    }

    // Check if booking can be cancelled
    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Booking is already cancelled'
      });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel completed bookings'
      });
    }

    // Update status to cancelled
    booking.status = 'cancelled';
    await booking.save();

    // Send cancellation notification (non-blocking)
    sendCancellationNotification({
      bookingId: booking._id,
      userEmail: booking.userEmail,
      userName: booking.userName,
      roomName: booking.roomName,
      locationName: booking.locationName,
      date: booking.bookingDate
    }).catch(err => console.error('Notification error:', err));

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking.toJSON()
    });

  } catch (error) {
    console.error('Cancel booking error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid booking ID format'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to cancel booking',
      message: error.message
    });
  }
};

/**
 * GET /bookings
 * Get all bookings (Admin only)
 */
exports.getAllBookings = async (req, res) => {
  try {
    const { status, date, roomId } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (date) query.date = date;
    if (roomId) query.roomId = roomId;

    const bookings = await Booking.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings.map(booking => booking.toJSON())
    });

  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bookings',
      message: error.message
    });
  }
};

/**
 * GET /bookings/room/:roomId/availability
 * Check room availability for upcoming dates
 */
exports.checkRoomAvailability = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
    }

    // Find all confirmed bookings for this room in the date range
    const bookings = await Booking.find({
      roomId,
      bookingDate: {
        $gte: startDate,
        $lte: endDate
      },
      status: { $in: ['confirmed', 'completed'] }
    }).sort({ bookingDate: 1 });

    const bookedDates = bookings.map(b => b.bookingDate);

    res.status(200).json({
      success: true,
      roomId,
      dateRange: {
        start: startDate,
        end: endDate
      },
      bookedDates,
      bookingsCount: bookings.length
    });

  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check availability',
      message: error.message
    });
  }
};

