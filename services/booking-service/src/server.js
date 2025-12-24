require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');

const PORT = process.env.PORT || 8003;

// Validate required environment variables
const requiredEnvVars = [
  'MONGODB_URI',
  'AUTH_SERVICE_URL',
  'ROOM_SERVICE_URL',
  'WEATHER_SERVICE_URL'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error(`ERROR: Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

// Connect to MongoDB
connectDB();

// Start server
const server = app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`📅 Booking Service running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`\n🔗 Connected Services:`);
  console.log(`   - Auth: ${process.env.AUTH_SERVICE_URL}`);
  console.log(`   - Room: ${process.env.ROOM_SERVICE_URL}`);
  console.log(`   - Weather: ${process.env.WEATHER_SERVICE_URL}`);
  console.log(`   - Notification: ${process.env.NOTIFICATION_SERVICE_URL || 'Not configured'}`);
  console.log(`\n💰 Pricing Configuration:`);
  console.log(`   - Comfortable Temp: ${process.env.COMFORTABLE_TEMPERATURE || 21}°C`);
  console.log(`   - Adjustment Factor: ${process.env.PRICE_ADJUSTMENT_FACTOR || 0.05}`);
  console.log('='.repeat(50));
});

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

