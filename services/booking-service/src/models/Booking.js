const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'User ID is required'],
    index: true
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Room ID is required'],
    index: true
  },
  bookingDate: {
    type: String, // Store as YYYY-MM-DD format
    required: [true, 'Booking date is required'],
    index: true
  },
  bookingReference: {
    type: String,
    required: true,
    unique: true,
    default: () => `BK${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`
  },
  basePrice: {
    type: Number,
    required: [true, 'Base price is required'],
    min: [0, 'Base price cannot be negative']
  },
  temperature: {
    type: Number,
    required: [true, 'Temperature is required']
  },
  deviation: {
    type: Number,
    required: [true, 'Temperature deviation is required']
  },
  adjustedPrice: {
    type: Number,
    required: [true, 'Adjusted price is required'],
    min: [0, 'Adjusted price cannot be negative']
  },
  status: {
    type: String,
    enum: ['confirmed', 'cancelled', 'completed'],
    default: 'confirmed'
  },
  // Store user and room details for reference
  userEmail: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  roomName: {
    type: String,
    required: true
  },
  locationName: {
    type: String,
    required: true
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

// Compound index for checking availability
bookingSchema.index({ roomId: 1, bookingDate: 1, status: 1 });

// Compound index for user bookings
bookingSchema.index({ userId: 1, status: 1 });

// Method to format booking data
bookingSchema.methods.toJSON = function() {
  const booking = this.toObject();
  delete booking.__v;
  return booking;
};

module.exports = mongoose.model('Booking', bookingSchema);

