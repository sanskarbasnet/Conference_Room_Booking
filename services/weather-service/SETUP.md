# Weather Service - Setup & Testing Guide

## 📋 Setup Instructions

### Step 1: Install Dependencies

```powershell
cd services/weather-service
npm install
```

### Step 2: Create Environment File

Copy the example environment file:
```powershell
copy .env.example .env
```

Or manually create `.env` with these contents:
```
PORT=8004
NODE_ENV=development
MIN_TEMPERATURE=15
MAX_TEMPERATURE=27
COMFORTABLE_TEMPERATURE=21
```

> **Note:** MongoDB URI is optional. The service works without a database by generating fresh forecasts each time.

### Step 3: Start the Service

**Development mode (with auto-reload):**
```powershell
npm run dev
```

**Production mode:**
```powershell
npm start
```

You should see:
```
==================================================
🌤️  Weather Service running on port 8004
📍 Environment: development
🔗 Health check: http://localhost:8004/health
🌡️  Temperature range: 15°C - 27°C
❄️  Comfortable temperature: 21°C
==================================================
```

---

## 🧪 Testing the Service

### Test 1: Health Check

```powershell
curl http://localhost:8004/health
```

**Expected Response:**
```json
{
  "success": true,
  "service": "weather-service",
  "status": "healthy",
  "timestamp": "2025-12-17T10:30:00.000Z",
  "uptime": 10.5
}
```

### Test 2: Service Info

```powershell
curl http://localhost:8004/
```

**Expected Response:**
```json
{
  "success": true,
  "service": "Weather Forecast Service",
  "version": "1.0.0",
  "description": "Simulates weather forecasts for conference room booking system",
  "endpoints": {
    "health": "GET /health",
    "forecast": "GET /forecast/:locationId/:date",
    "bulkForecast": "POST /forecast/bulk",
    "clearCache": "DELETE /forecast/:locationId/:date"
  }
}
```

### Test 3: Get Weather Forecast

```powershell
curl http://localhost:8004/forecast/507f1f77bcf86cd799439011/2025-12-25
```

**Expected Response:**
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

> **Note:** Temperature will be random between 15-27°C each time (unless cached in DB)

### Test 4: Different Dates and Locations

```powershell
# Test different location
curl http://localhost:8004/forecast/507f1f77bcf86cd799439012/2025-12-26

# Test future date
curl http://localhost:8004/forecast/507f1f77bcf86cd799439011/2026-01-15

# Test today
curl http://localhost:8004/forecast/507f1f77bcf86cd799439011/2025-12-17
```

### Test 5: Invalid Requests

**Invalid locationId format:**
```powershell
curl http://localhost:8004/forecast/invalid-id/2025-12-25
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Invalid locationId format. Must be a valid MongoDB ObjectId."
}
```

**Invalid date format:**
```powershell
curl http://localhost:8004/forecast/507f1f77bcf86cd799439011/12-25-2025
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Invalid date format. Use YYYY-MM-DD."
}
```

### Test 6: Bulk Forecasts

```powershell
curl -X POST http://localhost:8004/forecast/bulk `
  -H "Content-Type: application/json" `
  -d '{
    "forecasts": [
      { "locationId": "507f1f77bcf86cd799439011", "date": "2025-12-25" },
      { "locationId": "507f1f77bcf86cd799439012", "date": "2025-12-26" },
      { "locationId": "507f1f77bcf86cd799439013", "date": "2025-12-27" }
    ]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "locationId": "507f1f77bcf86cd799439011",
      "date": "2025-12-25",
      "temperature": 19,
      "deviation": 2,
      "comfortableTemperature": 21
    },
    {
      "locationId": "507f1f77bcf86cd799439012",
      "date": "2025-12-26",
      "temperature": 25,
      "deviation": 4,
      "comfortableTemperature": 21
    },
    {
      "locationId": "507f1f77bcf86cd799439013",
      "date": "2025-12-27",
      "temperature": 16,
      "deviation": 5,
      "comfortableTemperature": 21
    }
  ]
}
```

---

## 🐳 Docker Testing

### Build Docker Image

```powershell
cd services/weather-service
docker build -t weather-service:latest .
```

### Run Container

```powershell
docker run -p 8004:8004 `
  -e PORT=8004 `
  -e NODE_ENV=production `
  -e MIN_TEMPERATURE=15 `
  -e MAX_TEMPERATURE=27 `
  -e COMFORTABLE_TEMPERATURE=21 `
  weather-service:latest
```

### Test Container

```powershell
# Health check
curl http://localhost:8004/health

# Get forecast
curl http://localhost:8004/forecast/507f1f77bcf86cd799439011/2025-12-25
```

### Stop Container

```powershell
docker ps
docker stop <container_id>
```

---

## 🎯 Understanding Temperature & Deviation

### How It Works

1. **Temperature Range:** Random between 15°C and 27°C
2. **Comfortable Temperature:** 21°C (baseline)
3. **Deviation:** `abs(temperature - 21)`

### Examples

| Temperature | Deviation | Price Impact |
|------------|-----------|--------------|
| 21°C | 0 | No adjustment (1.0x) |
| 18°C | 3 | +15% (1.15x) |
| 24°C | 3 | +15% (1.15x) |
| 15°C | 6 | +30% (1.30x) |
| 27°C | 6 | +30% (1.30x) |

**Price Adjustment Formula (used in Booking Service):**
```
adjustedPrice = basePrice × (1 + (deviation × 0.05))
```

---

## 📁 Project Structure

```
weather-service/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection (optional)
│   ├── controllers/
│   │   └── weatherController.js # Core business logic
│   ├── models/
│   │   └── Forecast.js          # Mongoose schema for caching
│   ├── routes/
│   │   └── weatherRoutes.js     # API endpoints
│   ├── middleware/
│   │   ├── errorHandler.js      # Global error handler
│   │   └── notFound.js          # 404 handler
│   ├── app.js                   # Express app configuration
│   └── server.js                # Server entry point
├── Dockerfile                   # Container configuration
├── .dockerignore               # Docker ignore rules
├── .env.example                # Environment template
├── .gitignore                  # Git ignore rules
├── package.json                # Dependencies
├── README.md                   # Documentation
└── SETUP.md                    # This file
```

---

## 🔍 Troubleshooting

### Service won't start

**Problem:** Port 8004 already in use
```powershell
# Find process using port 8004
netstat -ano | findstr :8004

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Can't connect to MongoDB

**Problem:** MongoDB connection error

**Solution:** This is normal if you haven't provided a MongoDB URI. The service works without database by generating fresh forecasts.

To add MongoDB (optional):
```
# Add to .env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/conference-booking
```

### Invalid locationId error

**Problem:** `Invalid locationId format`

**Solution:** Ensure locationId is a 24-character hexadecimal string (MongoDB ObjectId format)

Valid examples:
- `507f1f77bcf86cd799439011`
- `5f9b3b3b9b3b9b3b9b3b9b3b`

### Date format error

**Problem:** `Invalid date format`

**Solution:** Use YYYY-MM-DD format
- ✅ Correct: `2025-12-25`
- ❌ Wrong: `12/25/2025`, `25-12-2025`

---

## ✅ Verification Checklist

Before moving to the next service, verify:

- [ ] Service starts successfully on port 8004
- [ ] Health check returns 200 OK
- [ ] Can get forecast with valid locationId and date
- [ ] Temperature is between 15-27°C
- [ ] Deviation is calculated correctly
- [ ] Invalid requests return proper error messages
- [ ] Docker image builds successfully
- [ ] Container runs and responds to requests

---

## 🚀 Next Steps

Once Weather Service is working:
1. **Confirm** it's working correctly
2. Move to **Auth Service** implementation
3. Use Weather Service in **Booking Service** for price calculations

---

## 📞 API Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service health status |
| `/` | GET | Service information |
| `/forecast/:locationId/:date` | GET | Get single forecast |
| `/forecast/bulk` | POST | Get multiple forecasts |
| `/forecast/:locationId/:date` | DELETE | Clear cached forecast |

---

## 💡 Tips

1. **Temperature is random** - each request generates a new temperature unless cached
2. **No external API** - everything is simulated internally
3. **Database is optional** - works fine without MongoDB
4. **24-hour cache** - if using DB, forecasts expire after 24 hours
5. **Consistent format** - always use YYYY-MM-DD for dates

---

**Service Status:** ✅ Complete and ready for testing!

**What to do next:** Test all endpoints, then let me know when you're ready for the next service (Auth Service).

