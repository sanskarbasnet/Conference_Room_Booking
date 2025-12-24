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
  // Since services are behind ALB, we check them through known working endpoints
  // rather than /health endpoints which may not be exposed through ALB routing
  const serviceHealth = {};
  
  // Map of service names to their test endpoints (endpoints that should work if service is up)
  const serviceTestEndpoints = {
    auth: '/auth/verify', // Auth verify endpoint (returns 401 without token, but service is up)
    room: '/locations', // List locations endpoint
    booking: '/bookings', // List bookings (returns 401 without token, but service is up)
    weather: '/weather/forecast/507f1f77bcf86cd799439011/2025-12-25', // Weather forecast (may return error but service is up)
    notification: '/notifications/test' // Notification test endpoint
  };
  
  // Get base URL (ALB URL or localhost)
  const getBaseUrl = () => {
    // If any service URL contains the ALB domain, extract the base
    for (const url of Object.values(services)) {
      if (url.includes('elb.amazonaws.com')) {
        const match = url.match(/https?:\/\/[^\/]+/);
        return match ? match[0] : url.split('/').slice(0, 3).join('/');
      }
    }
    return 'http://localhost:8000';
  };
  
  const baseUrl = getBaseUrl();
  
  for (const [name, url] of Object.entries(services)) {
    try {
      // Try health endpoint first if URL doesn't have a path prefix
      let healthUrl = url.includes('/') && !url.endsWith('/') 
        ? `${url}/health` 
        : `${url}/health`;
      
      // If that fails or URL has path prefix, use test endpoint through base URL
      const testEndpoint = serviceTestEndpoints[name];
      let checkUrl = healthUrl;
      
      if (testEndpoint && (url.includes('elb.amazonaws.com') || url.includes('/'))) {
        // Use test endpoint through base URL (ALB)
        checkUrl = `${baseUrl}${testEndpoint}`;
      }
      
      const response = await axios.get(checkUrl, { 
        timeout: 10000,
        validateStatus: (status) => status < 500 // Accept 2xx, 3xx, 4xx as "service is up"
      });
      
      // Service is healthy if we get any response (even 401/404 means service is up)
      const isHealthy = response.status < 500;
      
      serviceHealth[name] = {
        status: isHealthy ? 'healthy' : 'unhealthy',
        url: url,
        checkUrl: checkUrl,
        statusCode: response.status,
        uptime: response.data?.uptime
      };
    } catch (error) {
      // Service is unhealthy if we can't reach it or get 5xx error
      const errorMsg = error.response?.data?.error || 
                     error.response?.statusText || 
                     error.message ||
                     'Service unreachable';
      const statusCode = error.response?.status;
      
      // If we get 401/404, service is actually up (just wrong endpoint or auth required)
      const isActuallyHealthy = statusCode && statusCode < 500 && statusCode >= 400;
      
      serviceHealth[name] = {
        status: isActuallyHealthy ? 'healthy' : 'unhealthy',
        url: url,
        error: errorMsg,
        statusCode: statusCode
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

