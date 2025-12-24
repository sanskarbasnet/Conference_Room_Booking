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
    // Log error details for debugging
    console.warn(`Weather service error for ${locationId} on ${date}:`, {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: `${WEATHER_SERVICE_URL}/forecast/${locationId}/${date}`
    });
    
    // Handle ALL errors gracefully - return default forecast instead of throwing
    // This ensures booking creation doesn't fail due to weather service issues
    const isRateLimited = error.response?.status === 429 || 
                         error.response?.data?.error?.includes('Too many requests');
    const isServiceUnavailable = error.response?.status === 503 ||
                                error.code === 'ECONNABORTED' ||
                                error.code === 'ECONNREFUSED' ||
                                error.code === 'ETIMEDOUT' ||
                                error.code === 'ENOTFOUND';
    const isServerError = error.response?.status >= 500;
    const isClientError = error.response?.status >= 400 && error.response?.status < 500;
    
    if (isRateLimited || isServiceUnavailable || isServerError || isClientError) {
      console.warn(`Weather service unavailable (${error.code || error.response?.status || 'unknown'}), using default forecast for ${locationId} on ${date}`);
      // Return default forecast (comfortable temperature, no deviation)
      const comfortableTemp = parseInt(process.env.COMFORTABLE_TEMPERATURE) || 21;
      return {
        temperature: comfortableTemp,
        condition: 'Clear',
        description: 'Default forecast due to weather service unavailability',
        deviation: 0,
        comfortableTemperature: comfortableTemp,
        cached: false,
        fallback: true
      };
    }
    
    // For any other unexpected error, also return default forecast
    console.warn(`Weather service unexpected error, using default forecast for ${locationId} on ${date}`);
    const comfortableTemp = parseInt(process.env.COMFORTABLE_TEMPERATURE) || 21;
    return {
      temperature: comfortableTemp,
      condition: 'Clear',
      description: 'Default forecast due to weather service error',
      deviation: 0,
      comfortableTemperature: comfortableTemp,
      cached: false,
      fallback: true
    };
  }
};

module.exports = {
  getForecast
};

