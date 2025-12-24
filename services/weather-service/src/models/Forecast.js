const mongoose = require('mongoose');

const forecastSchema = new mongoose.Schema({
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  date: {
    type: String, // Store as YYYY-MM-DD format
    required: true,
    index: true
  },
  temperature: {
    type: Number,
    required: true,
    min: 15,
    max: 27
  },
  deviation: {
    type: Number,
    required: true
  },
  cachedAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // Auto-delete after 24 hours
  }
}, {
  timestamps: true
});

// Compound index for efficient lookups
forecastSchema.index({ locationId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Forecast', forecastSchema);

