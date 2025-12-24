/**
 * POST /notify
 * Send notification (currently logs to console)
 */
exports.sendNotification = async (req, res) => {
  try {
    const { type, booking } = req.body;

    if (!type || !booking) {
      return res.status(400).json({
        success: false,
        error: 'Notification type and booking data are required'
      });
    }

    // Log notification details
    console.log('\n' + '='.repeat(60));
    console.log(`📧 NOTIFICATION: ${type.toUpperCase()}`);
    console.log('='.repeat(60));
    
    if (type === 'booking_confirmation') {
      console.log(`To: ${booking.userEmail}`);
      console.log(`Subject: Booking Confirmation - ${booking.roomName}`);
      console.log(`\nDear ${booking.userName},`);
      console.log(`\nYour booking has been confirmed!`);
      console.log(`\nBooking Details:`);
      console.log(`  - Room: ${booking.roomName}`);
      console.log(`  - Location: ${booking.locationName}`);
      console.log(`  - Date: ${booking.date}`);
      console.log(`  - Base Price: $${booking.basePrice}`);
      console.log(`  - Temperature: ${booking.temperature}°C`);
      console.log(`  - Price Adjustment: ${booking.deviation}°C deviation`);
      console.log(`  - Final Price: $${booking.adjustedPrice}`);
      console.log(`  - Booking ID: ${booking.bookingId}`);
      console.log(`\nThank you for choosing our conference rooms!`);
    } else if (type === 'booking_cancellation') {
      console.log(`To: ${booking.userEmail}`);
      console.log(`Subject: Booking Cancellation - ${booking.roomName}`);
      console.log(`\nDear ${booking.userName},`);
      console.log(`\nYour booking has been cancelled.`);
      console.log(`\nCancelled Booking:`);
      console.log(`  - Room: ${booking.roomName}`);
      console.log(`  - Location: ${booking.locationName}`);
      console.log(`  - Date: ${booking.date}`);
      console.log(`  - Booking ID: ${booking.bookingId}`);
      console.log(`\nIf you have any questions, please contact support.`);
    } else {
      console.log(`Unknown notification type: ${type}`);
      console.log(`Data:`, JSON.stringify(booking, null, 2));
    }
    
    console.log('='.repeat(60) + '\n');

    // In production, integrate with AWS SES or other email service
    // await sendEmail(booking.userEmail, subject, body);

    res.status(200).json({
      success: true,
      message: 'Notification sent successfully',
      data: {
        type,
        recipient: booking.userEmail,
        status: 'logged',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send notification',
      message: error.message
    });
  }
};

/**
 * GET /notifications/test
 * Test notification endpoint
 */
exports.testNotification = async (req, res) => {
  try {
    const testBooking = {
      userEmail: 'test@example.com',
      userName: 'Test User',
      roomName: 'Test Room',
      locationName: 'Test Location',
      date: '2025-12-25',
      basePrice: 100,
      temperature: 18,
      deviation: 3,
      adjustedPrice: 115,
      bookingId: 'test-123'
    };

    console.log('\n' + '='.repeat(60));
    console.log('📧 TEST NOTIFICATION');
    console.log('='.repeat(60));
    console.log('This is a test notification');
    console.log('Service is working correctly!');
    console.log('='.repeat(60) + '\n');

    res.status(200).json({
      success: true,
      message: 'Test notification sent',
      data: testBooking
    });

  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test notification',
      message: error.message
    });
  }
};

