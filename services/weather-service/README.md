# Weather Forecast Service

Simulates weather forecasts for the Conference Room Booking System.

## Features

- Simulates temperature data between 15°C and 27°C
- Calculates deviation from comfortable temperature (21°C)
- Optional MongoDB caching to maintain consistency
- RESTful API with Express.js
- Dockerized for containerization

## API Endpoints

### Get Forecast
```
GET /forecast/:locationId/:date
```
Returns simulated weather forecast for a specific location and date.

**Example:**
```bash
GET /forecast/507f1f77bcf86cd799439011/2025-12-25
```

**Response:**
```json
{
  "success": true,
  "data": {
    "locationId": "507f1f77bcf86cd799439011",
    "date": "2025-12-25",
    "temperature": 18,
    "deviation": 3,
    "comfortableTemperature": 21,
    "cached": false,
    "generatedAt": "2025-12-17T10:30:00.000Z"
  }
}
```

### Bulk Forecasts
```
POST /forecast/bulk
```
Get multiple forecasts in one request.

**Body:**
```json
{
  "forecasts": [
    { "locationId": "507f1f77bcf86cd799439011", "date": "2025-12-25" },
    { "locationId": "507f1f77bcf86cd799439012", "date": "2025-12-26" }
  ]
}
```

### Clear Cache
```
DELETE /forecast/:locationId/:date
```
Clears cached forecast data.

### Health Check
```
GET /health
```
Returns service health status.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Service port | 8004 |
| MONGODB_URI | MongoDB connection string (optional) | - |
| MIN_TEMPERATURE | Minimum simulated temperature | 15 |
| MAX_TEMPERATURE | Maximum simulated temperature | 27 |
| COMFORTABLE_TEMPERATURE | Base temperature for deviation | 21 |
| NODE_ENV | Environment | development |

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration

4. Run the service:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## Docker

Build image:
```bash
docker build -t weather-service .
```

Run container:
```bash
docker run -p 8004:8004 --env-file .env weather-service
```

## Testing

Test the service using curl:

```bash
# Health check
curl http://localhost:8004/health

# Get forecast (replace with valid locationId)
curl http://localhost:8004/forecast/507f1f77bcf86cd799439011/2025-12-25

# Bulk forecasts
curl -X POST http://localhost:8004/forecast/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "forecasts": [
      { "locationId": "507f1f77bcf86cd799439011", "date": "2025-12-25" }
    ]
  }'
```

## Business Logic

**Temperature Deviation:**
- Formula: `deviation = abs(temperature - 21)`
- Used by Booking Service to adjust room prices
- Higher deviation = higher price adjustment

**Price Adjustment (in Booking Service):**
```
adjustedPrice = basePrice * (1 + (deviation * 0.05))
```

## Project Structure

```
weather-service/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── controllers/
│   │   └── weatherController.js # Business logic
│   ├── models/
│   │   └── Forecast.js          # Mongoose schema
│   ├── routes/
│   │   └── weatherRoutes.js     # API routes
│   ├── middleware/
│   │   ├── errorHandler.js      # Error handling
│   │   └── notFound.js          # 404 handler
│   ├── app.js                   # Express app setup
│   └── server.js                # Server entry point
├── Dockerfile
├── .dockerignore
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Dependencies

- **express**: Web framework
- **mongoose**: MongoDB ODM (optional)
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment variables
- **morgan**: HTTP request logger

## Notes

- Database connection is optional; service works without MongoDB
- If no database is connected, forecasts are generated fresh each time
- With database, forecasts are cached for 24 hours
- Temperature is randomly generated within configured range

