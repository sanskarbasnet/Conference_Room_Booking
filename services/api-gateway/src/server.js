require('dotenv').config();
const app = require('./app');
const services = require('./config/services');

const PORT = process.env.PORT || 8000;

// Start server
const server = app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log(`🚪 API Gateway running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Gateway URL: http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`\n📡 Configured Services:`);
  console.log(`   - Auth Service:         ${services.auth}`);
  console.log(`   - Room Service:         ${services.room}`);
  console.log(`   - Booking Service:      ${services.booking}`);
  console.log(`   - Weather Service:      ${services.weather}`);
  console.log(`   - Notification Service: ${services.notification}`);
  console.log(`\n🛡️  Rate Limiting:`);
  console.log(`   - General: ${process.env.RATE_LIMIT_MAX_REQUESTS || 100} req/${(parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 60000}min`);
  console.log(`   - Auth: 5 req/15min`);
  console.log('='.repeat(60));
});

// Increase server timeout for slow operations (e.g., bcrypt hashing)
server.timeout = 120000; // 120 seconds
server.keepAliveTimeout = 120000;
server.headersTimeout = 125000;

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

