const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const proxyRoutes = require('./routes/proxyRoutes');
const { generalLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const services = require('./config/services');
const axios = require('axios');

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

// Apply general rate limiting to all requests
app.use(generalLimiter);

// Trust proxy (for rate limiting behind reverse proxies)
app.set('trust proxy', 1);

// Health check endpoint
app.get('/health', async (req, res) => {
  // Check health of all services
  const serviceHealth = {};
  
  for (const [name, url] of Object.entries(services)) {
    try {
      const response = await axios.get(`${url}/health`, { timeout: 10000 }); // Increased to 10 seconds
      serviceHealth[name] = {
        status: 'healthy',
        url,
        uptime: response.data.uptime
      };
    } catch (error) {
      serviceHealth[name] = {
        status: 'unhealthy',
        url,
        error: error.message
      };
    }
  }

  const allHealthy = Object.values(serviceHealth).every(s => s.status === 'healthy');

  res.status(allHealthy ? 200 : 503).json({
    success: allHealthy,
    service: 'api-gateway',
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: serviceHealth
  });
});

// Service info endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'API Gateway',
    version: '1.0.0',
    description: 'Central API Gateway for Conference Room Booking System',
    endpoints: {
      health: 'GET /health',
      auth: {
        register: 'POST /auth/register',
        login: 'POST /auth/login',
        verify: 'GET /auth/verify',
        profile: 'GET /auth/me'
      },
      locations: {
        list: 'GET /locations',
        get: 'GET /locations/:id',
        create: 'POST /locations (admin)',
        update: 'PUT /locations/:id (admin)',
        delete: 'DELETE /locations/:id (admin)'
      },
      rooms: {
        list: 'GET /rooms',
        get: 'GET /rooms/:id',
        byLocation: 'GET /rooms/location/:locationId',
        create: 'POST /rooms (admin)',
        update: 'PUT /rooms/:id (admin)',
        delete: 'DELETE /rooms/:id (admin)'
      },
      bookings: {
        create: 'POST /bookings (authenticated)',
        getUserBookings: 'GET /bookings/user/:userId (authenticated)',
        getBooking: 'GET /bookings/:id (authenticated)',
        cancel: 'DELETE /bookings/:id (authenticated)',
        availability: 'GET /bookings/room/:roomId/availability (authenticated)',
        getAll: 'GET /bookings (admin)'
      },
      weather: {
        forecast: 'GET /weather/forecast/:locationId/:date'
      }
    },
    services,
    rateLimit: {
      general: `${process.env.RATE_LIMIT_MAX_REQUESTS || 100} requests per ${(parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 60000} minutes`,
      auth: '5 requests per 15 minutes (login/register)'
    }
  });
});

// Proxy routes
app.use('/', proxyRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;

