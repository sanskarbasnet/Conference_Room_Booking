const Forecast = require('../models/Forecast');

// Configuration constants
const MIN_TEMP = parseInt(process.env.MIN_TEMPERATURE) || 15;
const MAX_TEMP = parseInt(process.env.MAX_TEMPERATURE) || 27;
const COMFORTABLE_TEMP = parseInt(process.env.COMFORTABLE_TEMPERATURE) || 21;

/**
 * Generate a random temperature between MIN_TEMP and MAX_TEMP
 */
const generateTemperature = () => {
  return Math.floor(Math.random() * (MAX_TEMP - MIN_TEMP + 1)) + MIN_TEMP;
};

/**
 * Calculate temperature deviation from comfortable temperature
 */
const calculateDeviation = (temperature) => {
  return Math.abs(temperature - COMFORTABLE_TEMP);
};

/**
 * GET /forecast/:locationId/:date
 * Get weather forecast for a specific location and date
 */
exports.getForecast = async (req, res) => {
  try {
    const { locationId, date } = req.params;

    // Validate locationId format
    if (!locationId || locationId.length !== 24) {
      return res.status(400).json({
        success: false,
        error: 'Invalid locationId format. Must be a valid MongoDB ObjectId.'
      });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD.'
      });
    }

    // Check if forecast is cached in database (if DB is available)
    if (Forecast.db && Forecast.db.readyState === 1) {
      const cachedForecast = await Forecast.findOne({ locationId, date });
      
      if (cachedForecast) {
        console.log(`Returning cached forecast for ${locationId} on ${date}`);
        return res.status(200).json({
          success: true,
          data: {
            locationId: cachedForecast.locationId,
            date: cachedForecast.date,
            temperature: cachedForecast.temperature,
            deviation: cachedForecast.deviation,
            comfortableTemperature: COMFORTABLE_TEMP,
            cached: true,
            cachedAt: cachedForecast.cachedAt
          }
        });
      }
    }

    // Generate new simulated forecast
    const temperature = generateTemperature();
    const deviation = calculateDeviation(temperature);

    const forecastData = {
      locationId,
      date,
      temperature,
      deviation,
      comfortableTemperature: COMFORTABLE_TEMP,
      cached: false,
      generatedAt: new Date()
    };

    // Try to cache the forecast (if DB is available)
    if (Forecast.db && Forecast.db.readyState === 1) {
      try {
        const newForecast = new Forecast({
          locationId,
          date,
          temperature,
          deviation
        });
        await newForecast.save();
        console.log(`Cached forecast for ${locationId} on ${date}`);
      } catch (error) {
        // If caching fails, just log and continue
        console.log('Failed to cache forecast:', error.message);
      }
    }

    res.status(200).json({
      success: true,
      data: forecastData
    });

  } catch (error) {
    console.error('Error generating forecast:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate weather forecast',
      message: error.message
    });
  }
};

/**
 * GET /forecast/bulk
 * Get forecasts for multiple locations and dates
 * Body: { forecasts: [{ locationId, date }, ...] }
 */
exports.getBulkForecasts = async (req, res) => {
  try {
    const { forecasts } = req.body;

    if (!Array.isArray(forecasts) || forecasts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request. Provide an array of forecasts with locationId and date.'
      });
    }

    const results = [];

    for (const forecast of forecasts) {
      const { locationId, date } = forecast;
      
      // Generate forecast for each request
      const temperature = generateTemperature();
      const deviation = calculateDeviation(temperature);

      results.push({
        locationId,
        date,
        temperature,
        deviation,
        comfortableTemperature: COMFORTABLE_TEMP
      });
    }

    res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });

  } catch (error) {
    console.error('Error generating bulk forecasts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate bulk weather forecasts',
      message: error.message
    });
  }
};

/**
 * DELETE /forecast/:locationId/:date
 * Clear cached forecast (if caching is enabled)
 */
exports.clearForecastCache = async (req, res) => {
  try {
    const { locationId, date } = req.params;

    if (!Forecast.db || Forecast.db.readyState !== 1) {
      return res.status(200).json({
        success: true,
        message: 'No cache to clear (database not connected)'
      });
    }

    const result = await Forecast.deleteOne({ locationId, date });

    res.status(200).json({
      success: true,
      message: result.deletedCount > 0 
        ? 'Forecast cache cleared successfully' 
        : 'No cached forecast found',
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('Error clearing forecast cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear forecast cache',
      message: error.message
    });
  }
};

