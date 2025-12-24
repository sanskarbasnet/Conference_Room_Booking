const { body } = require('express-validator');

/**
 * Validation rules for creating a booking
 */
exports.bookingValidation = [
  body('roomId')
    .notEmpty()
    .withMessage('Room ID is required')
    .isMongoId()
    .withMessage('Invalid room ID format'),
  
  body('date')
    .notEmpty()
    .withMessage('Booking date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date must be in YYYY-MM-DD format')
    .custom((value) => {
      const bookingDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (bookingDate < today) {
        throw new Error('Booking date must be in the future');
      }
      
      return true;
    })
];

