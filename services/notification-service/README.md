# Notification Service

Simple notification service for the Conference Room Booking System. Currently logs notifications to console, designed for future AWS SES integration.

## Features

- Booking confirmation notifications
- Booking cancellation notifications
- Console logging (current implementation)
- Ready for AWS SES integration (future)
- Simple RESTful API
- No authentication required (internal service)

## API Endpoints

### Send Notification
```
POST /notify
```

**Request Body:**
```json
{
  "type": "booking_confirmation",
  "booking": {
    "bookingId": "507f1f77bcf86cd799439011",
    "userEmail": "john@example.com",
    "userName": "John Doe",
    "roomName": "Conference Room A",
    "locationName": "London Office",
    "date": "2025-12-25",
    "basePrice": 250,
    "temperature": 18,
    "deviation": 3,
    "adjustedPrice": 287.5
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification sent successfully",
  "data": {
    "type": "booking_confirmation",
    "recipient": "john@example.com",
    "status": "logged",
    "timestamp": "2025-12-17T10:30:00.000Z"
  }
}
```

### Test Notification
```
GET /notifications/test
```
Sends a test notification to verify service is working.

### Health Check
```
GET /health
```

## Notification Types

### booking_confirmation
Sent when a booking is successfully created.

### booking_cancellation
Sent when a booking is cancelled.

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| PORT | Service port | 8005 | No |
| NODE_ENV | Environment | development | No |

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Run the service:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## Docker

Build image:
```bash
docker build -t notification-service .
```

Run container:
```bash
docker run -p 8005:8005 notification-service
```

## Integration

### Called by Booking Service

The Booking Service calls this service when:
- A booking is created → sends confirmation
- A booking is cancelled → sends cancellation notice

Calls are non-blocking - if notification fails, booking still succeeds.

## Current Implementation

### Console Logging

Notifications are currently logged to the console in a formatted display:

```
============================================================
📧 NOTIFICATION: BOOKING_CONFIRMATION
============================================================
To: john@example.com
Subject: Booking Confirmation - Conference Room A

Dear John Doe,

Your booking has been confirmed!

Booking Details:
  - Room: Conference Room A
  - Location: London Office
  - Date: 2025-12-25
  - Base Price: $250
  - Temperature: 18°C
  - Price Adjustment: 3°C deviation
  - Final Price: $287.5
  - Booking ID: 507f1f77bcf86cd799439011

Thank you for choosing our conference rooms!
============================================================
```

## Future: AWS SES Integration

To integrate with AWS SES for real email sending:

1. **Install AWS SDK:**
```bash
npm install @aws-sdk/client-ses
```

2. **Add to `.env`:**
```env
AWS_REGION=us-east-1
AWS_SES_FROM_EMAIL=noreply@yourdomain.com
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
```

3. **Update controller** to use SES instead of console.log

## Project Structure

```
notification-service/
├── src/
│   ├── controllers/
│   │   └── notificationController.js  # Notification logic
│   ├── middleware/
│   │   ├── errorHandler.js            # Error handling
│   │   └── notFound.js                # 404 handler
│   ├── routes/
│   │   └── notificationRoutes.js      # API endpoints
│   ├── app.js                         # Express app
│   └── server.js                      # Server entry point
├── Dockerfile
├── .dockerignore
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Dependencies

- **express**: Web framework
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment variables
- **morgan**: HTTP request logger

## Notes

- No database required
- No authentication (internal service)
- Designed to be called by Booking Service only
- Failures don't affect booking creation
- Easy to extend with real email service
- Can add SMS, push notifications, etc.

