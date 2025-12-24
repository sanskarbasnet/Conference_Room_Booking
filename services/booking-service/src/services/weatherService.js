const axios = require('axios');

const WEATHER_SERVICE_URL = process.env.WEATHER_SERVICE_URL || 'http://localhost:8004';

/**
 * Get weather forecast for a location and date
 * Returns default forecast if service is unavailable or rate limited
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
    // Handle rate limiting and service unavailability gracefully
    if (error.response?.status === 429 || 
        error.response?.data?.error?.includes('Too many requests') ||
        error.response?.status === 503 ||
        error.code === 'ECONNABORTED') {
      console.warn(`Weather service rate limited or unavailable, using default forecast for ${locationId} on ${date}`);
      // Return default forecast (comfortable temperature, no deviation)
      const comfortableTemp = parseInt(process.env.COMFORTABLE_TEMPERATURE) || 21;
      return {
        temperature: comfortableTemp,
        deviation: 0,
        comfortableTemperature: comfortableTemp,
        cached: false,
        fallback: true
      };
    }
    throw new Error(error.response?.data?.error || 'Weather service unavailable');
  }
};

module.exports = {
  getForecast
};

