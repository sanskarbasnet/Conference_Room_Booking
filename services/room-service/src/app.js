const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const locationRoutes = require('./routes/locationRoutes');
const roomRoutes = require('./routes/roomRoutes');
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
    service: 'room-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Service info endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'Room and Location Service',
    version: '1.0.0',
    description: 'Manages locations and conference rooms for booking system',
    endpoints: {
      health: 'GET /health',
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
      }
    }
  });
});

// Routes
app.use('/', locationRoutes);
app.use('/', roomRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;

