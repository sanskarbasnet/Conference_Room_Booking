const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const notificationRoutes = require('./routes/notificationRoutes');
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
    service: 'notification-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Service info endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'Notification Service',
    version: '1.0.0',
    description: 'Notification service for conference room booking confirmations',
    endpoints: {
      health: 'GET /health',
      notify: 'POST /notify',
      test: 'GET /notifications/test'
    },
    features: {
      currentImplementation: 'Console logging',
      futureImplementation: 'AWS SES email service'
    }
  });
});

// Routes
app.use('/', notificationRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;

