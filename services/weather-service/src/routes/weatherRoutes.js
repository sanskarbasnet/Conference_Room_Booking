const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');

// Get forecast for specific location and date
router.get('/forecast/:locationId/:date', weatherController.getForecast);

// Get bulk forecasts
router.post('/forecast/bulk', weatherController.getBulkForecasts);

// Clear forecast cache
router.delete('/forecast/:locationId/:date', weatherController.clearForecastCache);

module.exports = router;

