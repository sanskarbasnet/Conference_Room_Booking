/**
 * Service URLs configuration
 */
module.exports = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:8001',
  room: process.env.ROOM_SERVICE_URL || 'http://localhost:8002',
  booking: process.env.BOOKING_SERVICE_URL || 'http://localhost:8003',
  weather: process.env.WEATHER_SERVICE_URL || 'http://localhost:8004',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8005'
};

