require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');

const PORT = process.env.PORT || 8004;

// Connect to MongoDB (optional - for caching)
connectDB();

// Start server
const server = app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🌤️  Weather Service running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🌡️  Temperature range: ${process.env.MIN_TEMPERATURE || 15}°C - ${process.env.MAX_TEMPERATURE || 27}°C`);
  console.log(`❄️  Comfortable temperature: ${process.env.COMFORTABLE_TEMPERATURE || 21}°C`);
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

