# Booking Service - Setup & Testing Guide

## 📋 Setup Instructions

### Prerequisites

Make sure these services are running:
1. ✅ **Auth Service** (Port 8001)
2. ✅ **Room Service** (Port 8002)
3. ✅ **Weather Service** (Port 8004)
4. ⚠️ **Notification Service** (Port 8005) - Optional but recommended

### Step 1: Install Dependencies

```powershell
cd services/booking-service
npm install
```

### Step 2: Create Environment File

Create `.env` file in `services/booking-service/`:

```env
PORT=8003
NODE_ENV=development
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/conference-booking?retryWrites=true&w=majority
AUTH_SERVICE_URL=http://localhost:8001
ROOM_SERVICE_URL=http://localhost:8002
WEATHER_SERVICE_URL=http://localhost:8004
NOTIFICATION_SERVICE_URL=http://localhost:8005
COMFORTABLE_TEMPERATURE=21
PRICE_ADJUSTMENT_FACTOR=0.05
SERVICE_NAME=booking-service
```

### Step 3: Start All Required Services

```powershell
# Terminal 1: Auth Service
cd services/auth-service
npm run dev

# Terminal 2: Room Service
cd services/room-service
npm run dev

# Terminal 3: Weather Service
cd services/weather-service
npm run dev

# Terminal 4: Booking Service
cd services/booking-service
npm run dev
```

You should see:
```
==================================================
📅 Booking Service running on port 8003
📍 Environment: development
🔗 Health check: http://localhost:8003/health

🔗 Connected Services:
   - Auth: http://localhost:8001
   - Room: http://localhost:8002
   - Weather: http://localhost:8004
   - Notification: http://localhost:8005

💰 Pricing Configuration:
   - Comfortable Temp: 21°C
   - Adjustment Factor: 0.05
==================================================
```

---

## 🧪 Testing the Service

### Setup: Get User Token and Room ID

```powershell
# 1. Login as regular user
$userResponse = Invoke-RestMethod -Uri "http://localhost:8001/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"john@example.com","password":"password123"}'

$userToken = $userResponse.data.token
$userId = $userResponse.data.user.id
Write-Host "User Token: $userToken" -ForegroundColor Green
Write-Host "User ID: $userId" -ForegroundColor Green

# 2. Get available rooms
$rooms = Invoke-RestMethod -Uri "http://localhost:8002/rooms"
$roomId = $rooms.data[0]._id
$roomName = $rooms.data[0].name
$basePrice = $rooms.data[0].basePrice
Write-Host "Room ID: $roomId" -ForegroundColor Green
Write-Host "Room: $roomName ($basePrice)" -ForegroundColor Green
```

---

### Test 1: Health Check

```powershell
Invoke-RestMethod -Uri "http://localhost:8003/health"
```

**Expected Response:**
```json
{
  "success": true,
  "service": "booking-service",
  "status": "healthy",
  "services": {
    "auth": "http://localhost:8001",
    "room": "http://localhost:8002",
    "weather": "http://localhost:8004",
    "notification": "http://localhost:8005"
  }
}
```

---

### Test 2: Create a Booking

```powershell
$headers = @{
    Authorization = "Bearer $userToken"
}

$booking = @{
    roomId = $roomId
    date = "2025-12-25"
} | ConvertTo-Json

$bookingResponse = Invoke-RestMethod -Uri "http://localhost:8003/bookings" `
  -Method POST `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $booking

$bookingResponse | ConvertTo-Json -Depth 5

$bookingId = $bookingResponse.data.booking._id
Write-Host "`nBooking Created: $bookingId" -ForegroundColor Green
Write-Host "Base Price: $($bookingResponse.data.priceBreakdown.basePrice)" -ForegroundColor Cyan
Write-Host "Temperature: $($bookingResponse.data.priceBreakdown.temperature)°C" -ForegroundColor Cyan
Write-Host "Deviation: $($bookingResponse.data.priceBreakdown.deviation)°C" -ForegroundColor Cyan
Write-Host "Adjusted Price: $($bookingResponse.data.priceBreakdown.adjustedPrice)" -ForegroundColor Yellow
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "booking": {
      "_id": "...",
      "userId": "...",
      "roomId": "...",
      "date": "2025-12-25",
      "basePrice": 250,
      "temperature": 18,
      "deviation": 3,
      "adjustedPrice": 287.5,
      "status": "confirmed",
      "userEmail": "john@example.com",
      "userName": "John Doe",
      "roomName": "Conference Room A",
      "locationName": "London Office"
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

---

### Test 3: Try Booking Same Room/Date (Should Fail)

```powershell
try {
    $duplicateBooking = @{
        roomId = $roomId
        date = "2025-12-25"
    } | ConvertTo-Json

    Invoke-RestMethod -Uri "http://localhost:8003/bookings" `
      -Method POST `
      -Headers $headers `
      -ContentType "application/json" `
      -Body $duplicateBooking
} catch {
    Write-Host "Expected error: Room already booked" -ForegroundColor Yellow
    $_.ErrorDetails.Message
}
```

**Expected Error (400):**
```json
{
  "success": false,
  "error": "Room is already booked for this date"
}
```

---

### Test 4: Get User's Bookings

```powershell
$userBookings = Invoke-RestMethod -Uri "http://localhost:8003/bookings/user/$userId" `
  -Headers $headers

Write-Host "`nUser has $($userBookings.count) booking(s)" -ForegroundColor Green
$userBookings.data | Format-Table roomName, date, adjustedPrice, status -AutoSize
```

---

### Test 5: Get Specific Booking

```powershell
Invoke-RestMethod -Uri "http://localhost:8003/bookings/$bookingId" `
  -Headers $headers
```

---

### Test 6: Create Multiple Bookings (Different Dates)

```powershell
# Booking 2: Different date
$booking2 = @{
    roomId = $roomId
    date = "2025-12-26"
} | ConvertTo-Json

$booking2Response = Invoke-RestMethod -Uri "http://localhost:8003/bookings" `
  -Method POST `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $booking2

Write-Host "Booking 2 Created - Adjusted Price: $($booking2Response.data.priceBreakdown.adjustedPrice)" -ForegroundColor Green

# Booking 3: Different date
$booking3 = @{
    roomId = $roomId
    date = "2025-12-27"
} | ConvertTo-Json

$booking3Response = Invoke-RestMethod -Uri "http://localhost:8003/bookings" `
  -Method POST `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $booking3

Write-Host "Booking 3 Created - Adjusted Price: $($booking3Response.data.priceBreakdown.adjustedPrice)" -ForegroundColor Green
```

---

### Test 7: Check Room Availability

```powershell
$availability = Invoke-RestMethod -Uri "http://localhost:8003/bookings/room/$roomId/availability?startDate=2025-12-01&endDate=2025-12-31" `
  -Headers $headers

Write-Host "`nRoom Availability:" -ForegroundColor Yellow
Write-Host "Date Range: $($availability.dateRange.start) to $($availability.dateRange.end)"
Write-Host "Booked Dates: $($availability.bookedDates -join ', ')" -ForegroundColor Red
Write-Host "Total Bookings: $($availability.bookingsCount)"
```

---

### Test 8: Cancel a Booking

```powershell
$cancelResponse = Invoke-RestMethod -Uri "http://localhost:8003/bookings/$bookingId" `
  -Method DELETE `
  -Headers $headers

Write-Host "Booking Status: $($cancelResponse.data.status)" -ForegroundColor Yellow
```

---

### Test 9: Try Booking with Date in Past (Should Fail)

```powershell
try {
    $pastBooking = @{
        roomId = $roomId
        date = "2020-01-01"
    } | ConvertTo-Json

    Invoke-RestMethod -Uri "http://localhost:8003/bookings" `
      -Method POST `
      -Headers $headers `
      -ContentType "application/json" `
      -Body $pastBooking
} catch {
    Write-Host "Expected error: Date must be in future" -ForegroundColor Yellow
    $_.ErrorDetails.Message
}
```

---

### Test 10: Admin - View All Bookings

```powershell
# Login as admin
$adminResponse = Invoke-RestMethod -Uri "http://localhost:8001/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"admin@example.com","password":"admin123"}'

$adminToken = $adminResponse.data.token
$adminHeaders = @{ Authorization = "Bearer $adminToken" }

# Get all bookings
$allBookings = Invoke-RestMethod -Uri "http://localhost:8003/bookings" `
  -Headers $adminHeaders

Write-Host "`nTotal System Bookings: $($allBookings.count)" -ForegroundColor Cyan
$allBookings.data | Format-Table userName, roomName, date, adjustedPrice, status -AutoSize
```

---

### Test 11: Filter Bookings by Status

```powershell
# Get only confirmed bookings
$confirmedBookings = Invoke-RestMethod -Uri "http://localhost:8003/bookings/user/$userId`?status=confirmed" `
  -Headers $headers

Write-Host "Confirmed Bookings: $($confirmedBookings.count)" -ForegroundColor Green

# Get cancelled bookings
$cancelledBookings = Invoke-RestMethod -Uri "http://localhost:8003/bookings/user/$userId`?status=cancelled" `
  -Headers $headers

Write-Host "Cancelled Bookings: $($cancelledBookings.count)" -ForegroundColor Yellow
```

---

## 📊 Price Calculation Examples

Let's verify the pricing formula:

```powershell
# Create bookings and observe price adjustments
Write-Host "`n=== Price Calculation Test ===" -ForegroundColor Cyan

# Get different rooms with different base prices
$rooms = (Invoke-RestMethod -Uri "http://localhost:8002/rooms").data

foreach ($room in $rooms[0..2]) {
    $testBooking = @{
        roomId = $room._id
        date = "2026-01-0$($rooms.IndexOf($room) + 1)"
    } | ConvertTo-Json

    try {
        $result = Invoke-RestMethod -Uri "http://localhost:8003/bookings" `
          -Method POST `
          -Headers $headers `
          -ContentType "application/json" `
          -Body $testBooking

        $breakdown = $result.data.priceBreakdown
        $adjustment = (($breakdown.adjustedPrice - $breakdown.basePrice) / $breakdown.basePrice) * 100

        Write-Host "`nRoom: $($room.name)" -ForegroundColor White
        Write-Host "  Base Price: `$$($breakdown.basePrice)"
        Write-Host "  Temperature: $($breakdown.temperature)°C"
        Write-Host "  Deviation: $($breakdown.deviation)°C"
        Write-Host "  Adjustment: +$([math]::Round($adjustment, 2))%"
        Write-Host "  Final Price: `$$($breakdown.adjustedPrice)" -ForegroundColor Green
    } catch {
        Write-Host "  Room already booked or error" -ForegroundColor Red
    }
}
```

---

## 🐳 Docker Testing

### Build Docker Image

```powershell
cd services/booking-service
docker build -t booking-service:latest .
```

### Run Container

```powershell
docker run -p 8003:8003 `
  -e PORT=8003 `
  -e NODE_ENV=production `
  -e MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/conference-booking" `
  -e AUTH_SERVICE_URL="http://host.docker.internal:8001" `
  -e ROOM_SERVICE_URL="http://host.docker.internal:8002" `
  -e WEATHER_SERVICE_URL="http://host.docker.internal:8004" `
  -e NOTIFICATION_SERVICE_URL="http://host.docker.internal:8005" `
  -e COMFORTABLE_TEMPERATURE=21 `
  -e PRICE_ADJUSTMENT_FACTOR=0.05 `
  booking-service:latest
```

---

## ✅ Verification Checklist

Before moving to the next service, verify:

- [ ] Service starts successfully on port 8003
- [ ] Health check returns 200 OK
- [ ] Can create booking with valid room and date
- [ ] Weather service is called and temperature retrieved
- [ ] Price adjustment is calculated correctly
- [ ] Duplicate bookings are rejected (same room/date)
- [ ] Past dates are rejected
- [ ] Can view user's bookings
- [ ] Can view specific booking details
- [ ] Can cancel bookings
- [ ] Room availability check works
- [ ] Users can only see their own bookings
- [ ] Admins can see all bookings
- [ ] Price breakdown is accurate
- [ ] Notification service is called (check logs)

---

## 🔍 Troubleshooting

### Service Connection Errors

**Problem:** Cannot connect to Auth/Room/Weather Service

**Solution:**
1. Ensure all services are running
2. Check service URLs in `.env`
3. Verify services are healthy (`/health` endpoint)

### Room Already Booked Error

**Problem:** Getting "Room is already booked" unexpectedly

**Solution:**
1. Check if booking exists: `GET /bookings/room/:roomId/availability`
2. Use different date or different room
3. Cancel existing booking first

### Invalid Token Error

**Problem:** "Invalid or expired token"

**Solution:**
1. Login again to get fresh token
2. Verify Auth Service is running
3. Check token hasn't expired (7 days default)

### Price Calculation Issues

**Problem:** Adjusted price doesn't match expected

**Solution:**
1. Check Weather Service returns temperature
2. Verify formula: `adjustedPrice = basePrice * (1 + (|temp - 21| * 0.05))`
3. Check COMFORTABLE_TEMPERATURE and PRICE_ADJUSTMENT_FACTOR in `.env`

---

## 📞 API Summary

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/health` | GET | No | Service health |
| `/bookings` | POST | User | Create booking |
| `/bookings/user/:userId` | GET | User | Get user bookings |
| `/bookings/:id` | GET | User | Get booking |
| `/bookings/:id` | DELETE | User | Cancel booking |
| `/bookings/room/:roomId/availability` | GET | User | Check availability |
| `/bookings` | GET | Admin | All bookings |

---

**Service Status:** ✅ Complete and ready for testing!

**What to do next:**
1. Start all required services (Auth, Room, Weather)
2. Test booking creation with price calculation
3. Verify availability checking works
4. Test cancellation flow
5. Move to Notification Service (simple one!)

