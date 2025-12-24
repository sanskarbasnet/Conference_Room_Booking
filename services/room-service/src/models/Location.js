const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Location name is required'],
    trim: true,
    minlength: [2, 'Location name must be at least 2 characters'],
    maxlength: [100, 'Location name cannot exceed 100 characters']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
locationSchema.index({ city: 1, country: 1 });
locationSchema.index({ isActive: 1 });

// Virtual for full address
locationSchema.virtual('fullAddress').get(function() {
  return `${this.address}, ${this.city}, ${this.country}`;
});

// Method to get location with room count
locationSchema.methods.toJSON = function() {
  const location = this.toObject({ virtuals: true });
  delete location.__v;
  return location;
};

module.exports = mongoose.model('Location', locationSchema);

