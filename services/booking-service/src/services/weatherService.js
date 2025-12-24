const axios = require('axios');

const WEATHER_SERVICE_URL = process.env.WEATHER_SERVICE_URL || 'http://localhost:8004';

/**
 * Get weather forecast for a location and date
 */
const getForecast = async (locationId, date) => {
  try {
    const response = await axios.get(`${WEATHER_SERVICE_URL}/forecast/${locationId}/${date}`, {
      timeout: 30000 // 30 second timeout for weather service
    });
    
    if (response.data.success) {
      return response.data.data;
    }
    
    throw new Error('Failed to get weather forecast');
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Weather service unavailable');
  }
};

module.exports = {
  getForecast
};

