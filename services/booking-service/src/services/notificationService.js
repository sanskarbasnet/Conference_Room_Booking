const axios = require('axios');

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8005';

/**
 * Send booking confirmation notification
 */
const sendBookingConfirmation = async (bookingData) => {
  try {
    const response = await axios.post(`${NOTIFICATION_SERVICE_URL}/notify`, {
      type: 'booking_confirmation',
      booking: bookingData
    });
    
    return response.data;
  } catch (error) {
    // Don't fail booking if notification fails
    console.error('Failed to send notification:', error.message);
    return { success: false, message: 'Notification service unavailable' };
  }
};

/**
 * Send booking cancellation notification
 */
const sendCancellationNotification = async (bookingData) => {
  try {
    const response = await axios.post(`${NOTIFICATION_SERVICE_URL}/notify`, {
      type: 'booking_cancellation',
      booking: bookingData
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to send cancellation notification:', error.message);
    return { success: false, message: 'Notification service unavailable' };
  }
};

module.exports = {
  sendBookingConfirmation,
  sendCancellationNotification
};

