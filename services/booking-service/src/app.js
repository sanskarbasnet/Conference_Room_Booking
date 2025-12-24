const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bookingRoutes = require('./routes/bookingRoutes');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'booking-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      auth: process.env.AUTH_SERVICE_URL,
      room: process.env.ROOM_SERVICE_URL,
      weather: process.env.WEATHER_SERVICE_URL,
      notification: process.env.NOTIFICATION_SERVICE_URL
    }
  });
});

// Service info endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'Booking Service',
    version: '1.0.0',
    description: 'Conference room booking service with weather-based pricing',
    endpoints: {
      health: 'GET /health',
      createBooking: 'POST /bookings (authenticated)',
      getUserBookings: 'GET /bookings/user/:userId (authenticated)',
      getBooking: 'GET /bookings/:id (authenticated)',
      cancelBooking: 'DELETE /bookings/:id (authenticated)',
      checkAvailability: 'GET /bookings/room/:roomId/availability (authenticated)',
      getAllBookings: 'GET /bookings (admin)'
    },
    pricing: {
      formula: 'adjustedPrice = basePrice * (1 + (deviation * 0.05))',
      comfortableTemperature: '21°C',
      adjustmentFactor: '0.05 (5% per degree deviation)'
    }
  });
});

// Routes
app.use('/', bookingRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;

