# Booking Service

Core business logic service for the Conference Room Booking System. Handles bookings with weather-based dynamic pricing.

## Features

- Create and manage conference room bookings
- Dynamic pricing based on weather conditions
- Integration with Auth, Room, Weather, and Notification services
- Room availability checking
- Booking cancellation
- User-specific and admin views
- Automatic price calculation with temperature deviation

## Business Logic

### Price Adjustment Formula

```
deviation = |temperature - 21°C|
adjustedPrice = basePrice × (1 + (deviation × 0.05))
```

### Example Calculations

| Base Price | Temperature | Deviation | Adjustment | Final Price |
|-----------|-------------|-----------|------------|-------------|
| $100 | 21°C | 0° | 0% | $100.00 |
| $100 | 18°C | 3° | 15% | $115.00 |
| $100 | 24°C | 3° | 15% | $115.00 |
| $100 | 15°C | 6° | 30% | $130.00 |
| $100 | 27°C | 6° | 30% | $130.00 |
| $250 | 16°C | 5° | 25% | $312.50 |

## API Endpoints

### Create Booking (Authenticated)
```
POST /bookings
Headers: Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "roomId": "507f1f77bcf86cd799439011",
  "date": "2025-12-25"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "booking": {
      "_id": "507f1f77bcf86cd799439012",
      "userId": "507f1f77bcf86cd799439010",
      "roomId": "507f1f77bcf86cd799439011",
      "date": "2025-12-25",
      "basePrice": 250,
      "temperature": 18,
      "deviation": 3,
      "adjustedPrice": 287.5,
      "status": "confirmed",
      "userEmail": "john@example.com",
      "userName": "John Doe",
      "roomName": "Conference Room A",
      "locationName": "London Office",
      "createdAt": "2025-12-17T10:30:00.000Z"
    },
    "priceBreakdown": {
      "basePrice": 250,
      "temperature": 18,
      "comfortableTemperature": 21,
      "deviation": 3,
      "adjustmentFactor": 0.05,
      "adjustedPrice": 287.5
    }
  }
}
```

### Get User Bookings (Authenticated)
```
GET /bookings/user/:userId?status=confirmed
Headers: Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [...]
}
```

### Get Specific Booking (Authenticated)
```
GET /bookings/:id
Headers: Authorization: Bearer <token>
```

### Cancel Booking (Authenticated)
```
DELETE /bookings/:id
Headers: Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "data": {...}
}
```

### Check Room Availability (Authenticated)
```
GET /bookings/room/:roomId/availability?startDate=2025-12-01&endDate=2025-12-31
Headers: Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "roomId": "507f1f77bcf86cd799439011",
  "dateRange": {
    "start": "2025-12-01",
    "end": "2025-12-31"
  },
  "bookedDates": ["2025-12-15", "2025-12-20", "2025-12-25"],
  "bookingsCount": 3
}
```

### Get All Bookings (Admin Only)
```
GET /bookings?status=confirmed&date=2025-12-25
Headers: Authorization: Bearer <admin_token>
```

## Database Schema

### Booking Model

```javascript
{
  userId: ObjectId (required, indexed),
  roomId: ObjectId (required, indexed),
  date: String (YYYY-MM-DD, required, indexed),
  basePrice: Number (required, min: 0),
  temperature: Number (required),
  deviation: Number (required),
  adjustedPrice: Number (required, min: 0),
  status: String (enum: ['confirmed', 'cancelled', 'completed'], default: 'confirmed'),
  userEmail: String (required),
  userName: String (required),
  roomName: String (required),
  locationName: String (required),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `{ roomId: 1, date: 1, status: 1 }` - Check availability
- `{ userId: 1, status: 1 }` - User bookings
- `{ userId: 1 }` - User lookup
- `{ roomId: 1 }` - Room bookings

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| PORT | Service port | 8003 | No |
| MONGODB_URI | MongoDB connection string | - | Yes |
| AUTH_SERVICE_URL | Auth service URL | http://localhost:8001 | Yes |
| ROOM_SERVICE_URL | Room service URL | http://localhost:8002 | Yes |
| WEATHER_SERVICE_URL | Weather service URL | http://localhost:8004 | Yes |
| NOTIFICATION_SERVICE_URL | Notification service URL | http://localhost:8005 | No |
| COMFORTABLE_TEMPERATURE | Base temperature for pricing | 21 | No |
| PRICE_ADJUSTMENT_FACTOR | Price adjustment per degree | 0.05 | No |
| NODE_ENV | Environment | development | No |

## Service Integration

### 1. Auth Service
- Verifies JWT tokens for all requests
- Retrieves user information

### 2. Room Service
- Validates room exists and is active
- Retrieves room details (name, basePrice, location)

### 3. Weather Service
- Gets temperature forecast for booking date
- Calculates temperature deviation

### 4. Notification Service
- Sends booking confirmation emails (non-blocking)
- Sends cancellation notifications (non-blocking)

## Booking Flow

1. **User submits booking request** (roomId, date)
2. **Authenticate user** via Auth Service
3. **Validate date** is in the future
4. **Validate room** exists and is active (Room Service)
5. **Check availability** - room not already booked for date
6. **Get weather forecast** for location and date (Weather Service)
7. **Calculate adjusted price** based on temperature deviation
8. **Create booking** in database
9. **Send confirmation** via Notification Service (async)
10. **Return booking details** with price breakdown

## Validation Rules

### Date Validation
- Must be in YYYY-MM-DD format
- Must be in the future (not today or past)

### Room Availability
- Room must exist
- Room must be active
- Room cannot have another confirmed booking for the same date

### User Authorization
- Users can only view/cancel their own bookings
- Admins can view all bookings

## Error Handling

- `400 Bad Request`: Invalid input, date in past, room already booked
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Trying to access other user's bookings
- `404 Not Found`: Booking or room not found
- `500 Internal Server Error`: Service integration errors

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env`:
```env
PORT=8003
NODE_ENV=development
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/conference-booking
AUTH_SERVICE_URL=http://localhost:8001
ROOM_SERVICE_URL=http://localhost:8002
WEATHER_SERVICE_URL=http://localhost:8004
NOTIFICATION_SERVICE_URL=http://localhost:8005
COMFORTABLE_TEMPERATURE=21
PRICE_ADJUSTMENT_FACTOR=0.05
```

4. Ensure other services are running:
```bash
# Auth Service (Port 8001)
# Room Service (Port 8002)
# Weather Service (Port 8004)
# Notification Service (Port 8005) - optional
```

5. Run the service:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## Docker

Build image:
```bash
docker build -t booking-service .
```

Run container:
```bash
docker run -p 8003:8003 \
  -e MONGODB_URI=mongodb+srv://... \
  -e AUTH_SERVICE_URL=http://auth-service:8001 \
  -e ROOM_SERVICE_URL=http://room-service:8002 \
  -e WEATHER_SERVICE_URL=http://weather-service:8004 \
  -e NOTIFICATION_SERVICE_URL=http://notification-service:8005 \
  booking-service
```

## Project Structure

```
booking-service/
├── src/
│   ├── config/
│   │   └── database.js              # MongoDB connection
│   ├── controllers/
│   │   └── bookingController.js     # Booking logic
│   ├── models/
│   │   └── Booking.js               # Booking schema
│   ├── middleware/
│   │   ├── auth.js                  # Auth middleware
│   │   ├── validators.js            # Input validation
│   │   ├── errorHandler.js          # Error handling
│   │   └── notFound.js              # 404 handler
│   ├── services/
│   │   ├── authService.js           # Auth Service integration
│   │   ├── roomService.js           # Room Service integration
│   │   ├── weatherService.js        # Weather Service integration
│   │   └── notificationService.js   # Notification integration
│   ├── utils/
│   │   └── priceCalculator.js       # Price calculation logic
│   ├── routes/
│   │   └── bookingRoutes.js         # API endpoints
│   ├── app.js                       # Express app
│   └── server.js                    # Server entry point
├── Dockerfile
├── .dockerignore
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Dependencies

- **express**: Web framework
- **mongoose**: MongoDB ODM
- **axios**: HTTP client for service communication
- **express-validator**: Input validation
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment variables
- **morgan**: HTTP request logger

## Notes

- Bookings are for full days only
- Price adjustment is automatic based on weather
- Notification failures don't prevent booking creation
- Users can only manage their own bookings (unless admin)
- Room availability is checked in real-time
- Temperature is fetched live from Weather Service
- All prices are in USD (or your currency)

