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
    // Don't remove /auth prefix - auth service expects /auth/verify, /auth/login, etc.
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
// Handle both direct service URLs and ALB URLs with path prefixes
let weatherTarget = services.weather;
let weatherPathRewrite = { '^/weather': '' }; // Default: remove /weather prefix

// If the target URL is an ALB URL with /weather path, it would cause a routing loop
// because /weather/* routes to API Gateway. We need to use /weather-service/* instead.
if (weatherTarget.includes('elb.amazonaws.com') && weatherTarget.includes('/weather')) {
  // ALB URL with /weather path - this would cause a loop since /weather/* routes to API Gateway
  // Use /weather-service/* instead (direct service access via ALB)
  // Path rewrite: /weather/forecast/... -> /weather-service/forecast/...
  const baseAlbUrl = weatherTarget.split('/weather')[0];
  weatherTarget = baseAlbUrl; // Use base ALB URL, we'll add /weather-service in path rewrite
  weatherPathRewrite = { '^/weather': '/weather-service' }; // Change /weather to /weather-service
} else if (weatherTarget.includes('/weather') && !weatherTarget.endsWith('/weather')) {
  // URL has /weather in the middle but doesn't end with it - don't rewrite
  weatherPathRewrite = {};
} else {
  // Direct service URL or base URL - remove /weather prefix
  weatherPathRewrite = { '^/weather': '' };
}

router.use(
  '/weather',
  createProxyMiddleware({
    target: weatherTarget,
    ...proxyOptions,
    pathRewrite: weatherPathRewrite,
    onProxyReq: (proxyReq, req, res) => {
      // Enhanced logging for weather service
      console.log(`[Gateway] ${req.method} ${req.path} → ${weatherTarget}${proxyReq.path}`);
      // Call original onProxyReq if it exists
      if (proxyOptions.onProxyReq) {
        proxyOptions.onProxyReq(proxyReq, req, res);
      }
    },
    onError: (err, req, res) => {
      console.error(`[Gateway] Weather Service Error for ${req.path}:`, err.message);
      console.error(`[Gateway] Target URL: ${weatherTarget}`);
      console.error(`[Gateway] Path Rewrite:`, weatherPathRewrite);
      console.error(`[Gateway] Error Code:`, err.code);
      // Use the standard error handler
      proxyOptions.onError(err, req, res);
    }
  })
);

// Notification Service Routes (internal use, but exposed for testing)
router.use(
  '/notifications',
  createProxyMiddleware({
    // Notification service URL should be base URL (e.g., http://notification-service:8005)
    // We'll rewrite /notifications to /notification/test, /notification/notify, etc.
    target: services.notification,
    ...proxyOptions,
    pathRewrite: {
      '^/notifications': '/notification' // Convert /notifications to /notification
    }
  })
);

module.exports = router;

