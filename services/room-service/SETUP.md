# Room & Location Service - Setup & Testing Guide

## 📋 Setup Instructions

### Step 1: Install Dependencies

```powershell
cd services/room-service
npm install
```

### Step 2: Create Environment File

Create `.env` file in `services/room-service/`:

```env
PORT=8002
NODE_ENV=development
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/conference-booking?retryWrites=true&w=majority
AUTH_SERVICE_URL=http://localhost:8001
SERVICE_NAME=room-service
```

> **IMPORTANT:** Replace `MONGODB_URI` with your actual MongoDB Atlas connection string!

### Step 3: Ensure Auth Service is Running

The Room Service requires Auth Service for admin operations:
```powershell
# In a separate terminal, make sure Auth Service is running on port 8001
cd services/auth-service
npm run dev
```

### Step 4: Start the Service

```powershell
npm run dev
```

You should see:
```
==================================================
🏢 Room Service running on port 8002
📍 Environment: development
🔗 Health check: http://localhost:8002/health
🔐 Auth Service: http://localhost:8001
==================================================
MongoDB Connected: your-cluster.mongodb.net
```

---

## 🧪 Testing the Service

### Setup: Get Admin Token

First, you need an admin token from Auth Service:

```powershell
# Register an admin user (if not already done)
$adminResponse = Invoke-RestMethod -Uri "http://localhost:8001/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"admin@example.com","password":"admin123","name":"Admin User","role":"admin"}'

# Or login if already registered
$adminResponse = Invoke-RestMethod -Uri "http://localhost:8001/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"admin@example.com","password":"admin123"}'

# Save the admin token
$adminToken = $adminResponse.data.token
Write-Host "Admin Token: $adminToken" -ForegroundColor Green
```

---

### Test 1: Health Check

```powershell
Invoke-RestMethod -Uri "http://localhost:8002/health"
```

**Expected Response:**
```json
{
  "success": true,
  "service": "room-service",
  "status": "healthy",
  "timestamp": "2025-12-17T10:30:00.000Z",
  "uptime": 10.5
}
```

---

### Test 2: Get All Locations (Empty Initially)

```powershell
Invoke-RestMethod -Uri "http://localhost:8002/locations"
```

**Expected Response:**
```json
{
  "success": true,
  "count": 0,
  "data": []
}
```

---

### Test 3: Create Location (Admin Only)

```powershell
$headers = @{
    Authorization = "Bearer $adminToken"
}

$location1 = @{
    name = "London Office"
    address = "123 Business Street"
    city = "London"
    country = "UK"
    description = "Main office in London"
} | ConvertTo-Json

$loc1Response = Invoke-RestMethod -Uri "http://localhost:8002/locations" `
  -Method POST `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $location1

$locationId1 = $loc1Response.data._id
Write-Host "Location 1 Created: $locationId1" -ForegroundColor Green
```

---

### Test 4: Create Multiple Locations

```powershell
# Create second location
$location2 = @{
    name = "New York Office"
    address = "456 Manhattan Avenue"
    city = "New York"
    country = "USA"
    description = "USA headquarters"
} | ConvertTo-Json

$loc2Response = Invoke-RestMethod -Uri "http://localhost:8002/locations" `
  -Method POST `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $location2

$locationId2 = $loc2Response.data._id
Write-Host "Location 2 Created: $locationId2" -ForegroundColor Green

# Create third location
$location3 = @{
    name = "Tokyo Office"
    address = "789 Shibuya"
    city = "Tokyo"
    country = "Japan"
    description = "Asia Pacific office"
} | ConvertTo-Json

$loc3Response = Invoke-RestMethod -Uri "http://localhost:8002/locations" `
  -Method POST `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $location3

$locationId3 = $loc3Response.data._id
Write-Host "Location 3 Created: $locationId3" -ForegroundColor Green
```

---

### Test 5: Get All Locations (Now with Data)

```powershell
$locations = Invoke-RestMethod -Uri "http://localhost:8002/locations"
$locations.data | Format-Table name, city, country
```

---

### Test 6: Get Specific Location

```powershell
Invoke-RestMethod -Uri "http://localhost:8002/locations/$locationId1"
```

---

### Test 7: Filter Locations by City

```powershell
Invoke-RestMethod -Uri "http://localhost:8002/locations?city=London"
```

---

### Test 8: Create Rooms (Admin Only)

```powershell
# Room 1 in London Office
$room1 = @{
    name = "Conference Room A"
    locationId = $locationId1
    capacity = 20
    basePrice = 250
    amenities = @("Projector", "Whiteboard", "Video Conference")
    description = "Large conference room"
    floor = 3
} | ConvertTo-Json

$room1Response = Invoke-RestMethod -Uri "http://localhost:8002/rooms" `
  -Method POST `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $room1

$roomId1 = $room1Response.data._id
Write-Host "Room 1 Created: $roomId1" -ForegroundColor Green

# Room 2 in London Office
$room2 = @{
    name = "Meeting Room B"
    locationId = $locationId1
    capacity = 10
    basePrice = 150
    amenities = @("TV Screen", "Whiteboard")
    description = "Small meeting room"
    floor = 2
} | ConvertTo-Json

$room2Response = Invoke-RestMethod -Uri "http://localhost:8002/rooms" `
  -Method POST `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $room2

Write-Host "Room 2 Created: $($room2Response.data._id)" -ForegroundColor Green

# Room 3 in New York Office
$room3 = @{
    name = "Executive Boardroom"
    locationId = $locationId2
    capacity = 30
    basePrice = 500
    amenities = @("4K Display", "Video Conference", "Catering Service")
    description = "Premium boardroom"
    floor = 15
} | ConvertTo-Json

$room3Response = Invoke-RestMethod -Uri "http://localhost:8002/rooms" `
  -Method POST `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $room3

Write-Host "Room 3 Created: $($room3Response.data._id)" -ForegroundColor Green
```

---

### Test 9: Get All Rooms

```powershell
$rooms = Invoke-RestMethod -Uri "http://localhost:8002/rooms"
$rooms.data | Format-Table name, capacity, basePrice, @{Label="Location";Expression={$_.locationId.name}}
```

---

### Test 10: Get Specific Room

```powershell
Invoke-RestMethod -Uri "http://localhost:8002/rooms/$roomId1"
```

---

### Test 11: Get Rooms by Location

```powershell
# Get all rooms in London Office
Invoke-RestMethod -Uri "http://localhost:8002/rooms/location/$locationId1"
```

---

### Test 12: Filter Rooms by Capacity

```powershell
# Rooms with capacity between 10 and 25
Invoke-RestMethod -Uri "http://localhost:8002/rooms?minCapacity=10&maxCapacity=25"
```

---

### Test 13: Filter Rooms by Price

```powershell
# Rooms priced between $100 and $300
Invoke-RestMethod -Uri "http://localhost:8002/rooms?minPrice=100&maxPrice=300"
```

---

### Test 14: Update Location (Admin Only)

```powershell
$updateLocation = @{
    description = "Main office in Central London - Updated"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8002/locations/$locationId1" `
  -Method PUT `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $updateLocation
```

---

### Test 15: Update Room (Admin Only)

```powershell
$updateRoom = @{
    basePrice = 275
    amenities = @("Projector", "Whiteboard", "Video Conference", "Recording System")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8002/rooms/$roomId1" `
  -Method PUT `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $updateRoom
```

---

### Test 16: Try Creating Room Without Admin Token (Should Fail)

```powershell
# Get regular user token
$userResponse = Invoke-RestMethod -Uri "http://localhost:8001/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"john@example.com","password":"password123"}'

$userToken = $userResponse.data.token

# Try to create room with user token
$userHeaders = @{
    Authorization = "Bearer $userToken"
}

try {
    $room = @{
        name = "Unauthorized Room"
        locationId = $locationId1
        capacity = 5
        basePrice = 100
    } | ConvertTo-Json

    Invoke-RestMethod -Uri "http://localhost:8002/rooms" `
      -Method POST `
      -Headers $userHeaders `
      -ContentType "application/json" `
      -Body $room
} catch {
    Write-Host "Expected error: Access denied (403 Forbidden)" -ForegroundColor Yellow
    $_.ErrorDetails.Message
}
```

---

### Test 17: Try Deleting Location with Rooms (Should Fail)

```powershell
try {
    Invoke-RestMethod -Uri "http://localhost:8002/locations/$locationId1" `
      -Method DELETE `
      -Headers $headers
} catch {
    Write-Host "Expected error: Cannot delete location with rooms" -ForegroundColor Yellow
    $_.ErrorDetails.Message
}
```

---

### Test 18: Delete Room (Admin Only)

```powershell
# Create a test room to delete
$testRoom = @{
    name = "Temp Room to Delete"
    locationId = $locationId3
    capacity = 5
    basePrice = 100
} | ConvertTo-Json

$testRoomResponse = Invoke-RestMethod -Uri "http://localhost:8002/rooms" `
  -Method POST `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $testRoom

$testRoomId = $testRoomResponse.data._id

# Delete it
Invoke-RestMethod -Uri "http://localhost:8002/rooms/$testRoomId" `
  -Method DELETE `
  -Headers $headers

Write-Host "Room deleted successfully" -ForegroundColor Green
```

---

## 🐳 Docker Testing

### Build Docker Image

```powershell
cd services/room-service
docker build -t room-service:latest .
```

### Run Container

```powershell
docker run -p 8002:8002 `
  -e PORT=8002 `
  -e NODE_ENV=production `
  -e MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/conference-booking" `
  -e AUTH_SERVICE_URL="http://host.docker.internal:8001" `
  room-service:latest
```

> **Note:** Use `host.docker.internal` to access Auth Service from Docker container on Windows.

---

## 📊 Complete Test Script

Here's a complete PowerShell script to test everything:

```powershell
# Complete Room Service Test Script

Write-Host "`n=== Testing Room & Location Service ===" -ForegroundColor Cyan

# 1. Get Admin Token
Write-Host "`n1. Getting Admin Token..." -ForegroundColor Yellow
$adminResponse = Invoke-RestMethod -Uri "http://localhost:8001/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"admin@example.com","password":"admin123"}'

$adminToken = $adminResponse.data.token
$headers = @{ Authorization = "Bearer $adminToken" }
Write-Host "✓ Admin token obtained" -ForegroundColor Green

# 2. Create Locations
Write-Host "`n2. Creating Locations..." -ForegroundColor Yellow

$location1 = Invoke-RestMethod -Uri "http://localhost:8002/locations" `
  -Method POST `
  -Headers $headers `
  -ContentType "application/json" `
  -Body '{"name":"London Office","address":"123 Business St","city":"London","country":"UK"}'

$locationId1 = $location1.data._id
Write-Host "✓ London Office created: $locationId1" -ForegroundColor Green

# 3. Get All Locations
Write-Host "`n3. Getting All Locations..." -ForegroundColor Yellow
$locations = Invoke-RestMethod -Uri "http://localhost:8002/locations"
Write-Host "✓ Found $($locations.count) location(s)" -ForegroundColor Green

# 4. Create Rooms
Write-Host "`n4. Creating Rooms..." -ForegroundColor Yellow

$room1Body = @{
    name = "Conference Room A"
    locationId = $locationId1
    capacity = 20
    basePrice = 250
    amenities = @("Projector", "Whiteboard")
} | ConvertTo-Json

$room1 = Invoke-RestMethod -Uri "http://localhost:8002/rooms" `
  -Method POST `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $room1Body

Write-Host "✓ Conference Room A created: $($room1.data._id)" -ForegroundColor Green

# 5. Get All Rooms
Write-Host "`n5. Getting All Rooms..." -ForegroundColor Yellow
$rooms = Invoke-RestMethod -Uri "http://localhost:8002/rooms"
Write-Host "✓ Found $($rooms.count) room(s)" -ForegroundColor Green
$rooms.data | Format-Table name, capacity, basePrice -AutoSize

# 6. Get Rooms by Location
Write-Host "`n6. Getting Rooms for London Office..." -ForegroundColor Yellow
$locationRooms = Invoke-RestMethod -Uri "http://localhost:8002/rooms/location/$locationId1"
Write-Host "✓ Found $($locationRooms.count) room(s) in London Office" -ForegroundColor Green

Write-Host "`n=== All Tests Completed Successfully ===" -ForegroundColor Green
```

---

## ✅ Verification Checklist

Before moving to the next service, verify:

- [ ] Service starts successfully on port 8002
- [ ] Health check returns 200 OK
- [ ] Can create locations (with admin token)
- [ ] Can list all locations (no auth required)
- [ ] Can get specific location details
- [ ] Can create rooms (with admin token)
- [ ] Can list all rooms (no auth required)
- [ ] Can filter rooms by location
- [ ] Can filter rooms by capacity and price
- [ ] Room creation fails without admin token (403 Forbidden)
- [ ] Cannot delete location with existing rooms
- [ ] Location data includes room count
- [ ] Room data includes populated location details
- [ ] Docker image builds successfully

---

## 🔍 Troubleshooting

### Auth Service Connection Error

**Problem:** Cannot verify admin token

**Solution:**
1. Ensure Auth Service is running on port 8001
2. Check `AUTH_SERVICE_URL` in `.env`
3. Verify admin token is valid (not expired)

### MongoDB Connection Error

**Problem:** `MongoDB connection error`

**Solution:**
1. Check MONGODB_URI is correct
2. Ensure MongoDB Atlas allows connections from your IP
3. Verify database user credentials

### Invalid Location ID Error

**Problem:** `Invalid location ID format`

**Solution:**
- Location IDs must be valid MongoDB ObjectIds (24 hex characters)
- Copy location ID from creation response

---

## 📞 API Summary

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/health` | GET | No | Service health |
| `/locations` | GET | No | List locations |
| `/locations/:id` | GET | No | Get location |
| `/locations` | POST | Admin | Create location |
| `/locations/:id` | PUT | Admin | Update location |
| `/locations/:id` | DELETE | Admin | Delete location |
| `/rooms` | GET | No | List rooms |
| `/rooms/:id` | GET | No | Get room |
| `/rooms/location/:locationId` | GET | No | Rooms by location |
| `/rooms` | POST | Admin | Create room |
| `/rooms/:id` | PUT | Admin | Update room |
| `/rooms/:id` | DELETE | Admin | Delete room |

---

**Service Status:** ✅ Complete and ready for testing!

**What to do next:**
1. Create `.env` with your MongoDB URI
2. Ensure Auth Service is running
3. Get admin token from Auth Service
4. Test all endpoints
5. Verify data in MongoDB

