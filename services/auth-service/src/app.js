const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const authRoutes = require('./routes/authRoutes');
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
    service: 'auth-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Service info endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'Authentication Service',
    version: '1.0.0',
    description: 'User authentication and authorization for conference room booking system',
    endpoints: {
      health: 'GET /health',
      register: 'POST /register',
      login: 'POST /login',
      verify: 'GET /verify',
      profile: 'GET /me',
      updateProfile: 'PUT /me'
    }
  });
});

// Routes
app.use('/auth', authRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;

