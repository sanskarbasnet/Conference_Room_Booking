const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const router = express.Router();
const services = require('../config/services');
const { authLimiter } = require('../middleware/rateLimiter');

// Proxy options for all services
const proxyOptions = {
  changeOrigin: true,
  logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'error',
  timeout: 60000, // 60 second timeout for proxy requests
  proxyTimeout: 60000, // 60 second timeout for proxy response
  onError: (err, req, res) => {
    console.error(`Proxy Error for ${req.path}:`, err.message);
    res.status(503).json({
      success: false,
      error: 'Service Unavailable',
      message: 'The requested service is not responding'
    });
  },
  onProxyReq: (proxyReq, req, res) => {
    // Log proxied requests
    console.log(`[Gateway] ${req.method} ${req.path} → ${proxyReq.path}`);
    
    // Restream parsed body (for POST/PUT/PATCH requests)
    if (req.body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
      proxyReq.end();
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    // Log proxy responses
    console.log(`[Gateway] ${req.method} ${req.path} → ${proxyRes.statusCode}`);
  }
};

// Auth Service Routes
// Temporarily removed rate limiters for testing
// router.use('/auth/login', authLimiter); // Apply strict rate limiting to login
// router.use('/auth/register', authLimiter); // Apply strict rate limiting to register
router.use(
  '/auth',
  createProxyMiddleware({
    target: services.auth,
    ...proxyOptions,
    pathRewrite: {
      '^/auth': '' // Remove /auth prefix when forwarding
    },
    timeout: 60000 // 60 second timeout for auth requests (bcrypt can be slow)
  })
);

// Room Service Routes (Locations & Rooms)
router.use(
  '/locations',
  createProxyMiddleware({
    target: services.room,
    ...proxyOptions
  })
);

router.use(
  '/rooms',
  createProxyMiddleware({
    target: services.room,
    ...proxyOptions
  })
);

// Booking Service Routes
router.use(
  '/bookings',
  createProxyMiddleware({
    target: services.booking,
    ...proxyOptions,
    timeout: 120000, // 120 second timeout for bookings (needs to call weather service)
    proxyTimeout: 120000
  })
);

// Weather Service Routes
router.use(
  '/weather',
  createProxyMiddleware({
    target: services.weather,
    ...proxyOptions,
    pathRewrite: {
      '^/weather': '' // Remove /weather prefix
    }
  })
);

// Notification Service Routes (internal use, but exposed for testing)
router.use(
  '/notifications',
  createProxyMiddleware({
    target: services.notification,
    ...proxyOptions,
    pathRewrite: {
      '^/notifications': '' // Remove /notifications prefix when forwarding
    }
  })
);

module.exports = router;

