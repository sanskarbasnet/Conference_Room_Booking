require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 8005;

// Start server
const server = app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`📧 Notification Service running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📮 Current Mode: Console Logging`);
  console.log(`📨 Future: AWS SES Integration`);
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

