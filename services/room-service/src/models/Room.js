const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Room name is required'],
    trim: true,
    minlength: [2, 'Room name must be at least 2 characters'],
    maxlength: [100, 'Room name cannot exceed 100 characters']
  },
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: [true, 'Location ID is required'],
    index: true
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: [1, 'Capacity must be at least 1'],
    max: [1000, 'Capacity cannot exceed 1000']
  },
  basePrice: {
    type: Number,
    required: [true, 'Base price is required'],
    min: [0, 'Base price cannot be negative']
  },
  amenities: {
    type: [String],
    default: []
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  floor: {
    type: Number,
    min: [0, 'Floor cannot be negative']
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

// Compound index for efficient queries
roomSchema.index({ locationId: 1, isActive: 1 });
roomSchema.index({ capacity: 1 });
roomSchema.index({ basePrice: 1 });

// Method to format room data
roomSchema.methods.toJSON = function() {
  const room = this.toObject();
  delete room.__v;
  return room;
};

module.exports = mongoose.model('Room', roomSchema);

