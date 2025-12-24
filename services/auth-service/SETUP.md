# Auth Service - Setup & Testing Guide

## 📋 Setup Instructions

### Step 1: Install Dependencies

```powershell
cd services/auth-service
npm install
```

### Step 2: Create Environment File

Create `.env` file in `services/auth-service/` with:

```env
PORT=8001
NODE_ENV=development
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/conference-booking?retryWrites=true&w=majority
JWT_SECRET=my-super-secret-jwt-key-change-in-production-12345
JWT_EXPIRE=7d
SERVICE_NAME=auth-service
```

> **IMPORTANT:** Replace `MONGODB_URI` with your actual MongoDB Atlas connection string!

> **SECURITY:** Use a strong, random JWT_SECRET in production!

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
🔐 Auth Service running on port 8001
📍 Environment: development
🔗 Health check: http://localhost:8001/health
🔑 JWT expiration: 7d
==================================================
MongoDB Connected: your-cluster.mongodb.net
```

---

## 🧪 Testing the Service

### Test 1: Health Check

```powershell
curl http://localhost:8001/health
```

**Expected Response:**
```json
{
  "success": true,
  "service": "auth-service",
  "status": "healthy",
  "timestamp": "2025-12-17T10:30:00.000Z",
  "uptime": 10.5
}
```

### Test 2: Register a User

```powershell
curl -X POST http://localhost:8001/register `
  -H "Content-Type: application/json" `
  -d '{
    "email": "john@example.com",
    "password": "password123",
    "name": "John Doe",
    "role": "user"
  }'
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "john@example.com",
      "name": "John Doe",
      "role": "user",
      "createdAt": "2025-12-17T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUwN2YxZjc3YmNmODZjZDc5OTQzOTAxMSIsImVtYWlsIjoiam9obkBleGFtcGxlLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzAyODE0NDAwLCJleHAiOjE3MDM0MTkyMDB9.xyz123"
  }
}
```

**💡 Save this token!** You'll need it for testing protected endpoints.

### Test 3: Register an Admin User

```powershell
curl -X POST http://localhost:8001/register `
  -H "Content-Type: application/json" `
  -d '{
    "email": "admin@example.com",
    "password": "admin123",
    "name": "Admin User",
    "role": "admin"
  }'
```

### Test 4: Try Duplicate Registration (Should Fail)

```powershell
curl -X POST http://localhost:8001/register `
  -H "Content-Type: application/json" `
  -d '{
    "email": "john@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "User with this email already exists"
}
```

### Test 5: Login with Valid Credentials

```powershell
curl -X POST http://localhost:8001/login `
  -H "Content-Type: application/json" `
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "john@example.com",
      "name": "John Doe",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Test 6: Login with Invalid Credentials

```powershell
curl -X POST http://localhost:8001/login `
  -H "Content-Type: application/json" `
  -d '{
    "email": "john@example.com",
    "password": "wrongpassword"
  }'
```

**Expected Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

### Test 7: Verify Token

Replace `YOUR_TOKEN_HERE` with the actual token from registration/login:

```powershell
curl -X GET http://localhost:8001/verify `
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "john@example.com",
      "name": "John Doe",
      "role": "user"
    },
    "tokenData": {
      "id": "507f1f77bcf86cd799439011",
      "email": "john@example.com",
      "role": "user",
      "iat": 1702814400,
      "exp": 1703419200
    }
  }
}
```

### Test 8: Get User Profile (Protected Route)

```powershell
curl -X GET http://localhost:8001/me `
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "john@example.com",
      "name": "John Doe",
      "role": "user",
      "isActive": true,
      "createdAt": "2025-12-17T10:30:00.000Z",
      "updatedAt": "2025-12-17T10:30:00.000Z"
    }
  }
}
```

### Test 9: Update Profile

```powershell
curl -X PUT http://localhost:8001/me `
  -H "Authorization: Bearer YOUR_TOKEN_HERE" `
  -H "Content-Type: application/json" `
  -d '{
    "name": "John Smith"
  }'
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "john@example.com",
      "name": "John Smith",
      "role": "user"
    }
  }
}
```

### Test 10: Access Protected Route Without Token

```powershell
curl -X GET http://localhost:8001/me
```

**Expected Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Access denied. No token provided."
}
```

### Test 11: Invalid Token

```powershell
curl -X GET http://localhost:8001/verify `
  -H "Authorization: Bearer invalid-token-12345"
```

**Expected Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Invalid or expired token",
  "message": "Invalid token"
}
```

---

## 🐳 Docker Testing

### Build Docker Image

```powershell
cd services/auth-service
docker build -t auth-service:latest .
```

### Run Container

```powershell
docker run -p 8001:8001 `
  -e PORT=8001 `
  -e NODE_ENV=production `
  -e MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/conference-booking" `
  -e JWT_SECRET="my-super-secret-key" `
  -e JWT_EXPIRE="7d" `
  auth-service:latest
```

### Test Container

```powershell
# Health check
curl http://localhost:8001/health

# Register user
curl -X POST http://localhost:8001/register `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'
```

---

## 🔐 Password Security

### How Passwords are Handled

1. **Registration:**
   - User provides plain password
   - bcrypt generates a salt (10 rounds)
   - Password is hashed: `$2a$10$...` (60 characters)
   - Only hash is stored in database

2. **Login:**
   - User provides plain password
   - bcrypt compares with stored hash
   - Returns true/false (no password exposure)

3. **Storage:**
   - Original password is never stored
   - Hash is irreversible
   - Each user has unique salt

### Example Hash
```
Plain: "password123"
Hash: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
```

---

## 🎫 JWT Token Structure

### Token Parts

A JWT has three parts separated by dots:
```
header.payload.signature
```

### Example Token Payload
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "john@example.com",
  "role": "user",
  "iat": 1702814400,
  "exp": 1703419200
}
```

- **id**: User's MongoDB ObjectId
- **email**: User's email
- **role**: User's role (user/admin)
- **iat**: Issued at (timestamp)
- **exp**: Expires at (timestamp)

### Token Lifespan

Default: 7 days (configurable via `JWT_EXPIRE`)

Formats:
- `7d` = 7 days
- `24h` = 24 hours
- `60m` = 60 minutes
- `3600s` = 3600 seconds

---

## 🔍 Troubleshooting

### MongoDB Connection Error

**Problem:** `MongoDB connection error`

**Solutions:**
1. Check MONGODB_URI is correct
2. Ensure MongoDB Atlas allows connections from your IP
3. Verify database user credentials
4. Check network/firewall settings

### JWT_SECRET Not Defined

**Problem:** `JWT_SECRET is not defined`

**Solution:** Add JWT_SECRET to your `.env` file:
```env
JWT_SECRET=your-secret-key-here
```

### Port Already in Use

**Problem:** Port 8001 already in use

**Solution:**
```powershell
# Find process using port 8001
netstat -ano | findstr :8001

# Kill the process
taskkill /PID <PID> /F
```

### Invalid Token Format

**Problem:** Token verification fails

**Checklist:**
- Token includes "Bearer " prefix in Authorization header
- Token is complete (not truncated)
- Token hasn't expired
- JWT_SECRET matches between issuance and verification

---

## ✅ Verification Checklist

Before moving to the next service, verify:

- [ ] Service starts successfully on port 8001
- [ ] Health check returns 200 OK
- [ ] Can register new users
- [ ] Duplicate email registration is rejected
- [ ] Can login with valid credentials
- [ ] Invalid credentials are rejected
- [ ] JWT token is generated on login/register
- [ ] Token verification works
- [ ] Protected routes require authentication
- [ ] Can access /me with valid token
- [ ] Can update profile
- [ ] Passwords are hashed in database (not plain text)
- [ ] Docker image builds successfully
- [ ] Container runs and connects to MongoDB

---

## 📊 Sample Test Flow

**Complete workflow to test:**

```powershell
# 1. Register user
$response = curl -X POST http://localhost:8001/register `
  -H "Content-Type: application/json" `
  -d '{"email":"demo@test.com","password":"demo123","name":"Demo User"}' `
  | ConvertFrom-Json

# 2. Extract token
$token = $response.data.token

# 3. Verify token
curl -X GET http://localhost:8001/verify `
  -H "Authorization: Bearer $token"

# 4. Get profile
curl -X GET http://localhost:8001/me `
  -H "Authorization: Bearer $token"

# 5. Update profile
curl -X PUT http://localhost:8001/me `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{"name":"Demo User Updated"}'

# 6. Login again
curl -X POST http://localhost:8001/login `
  -H "Content-Type: application/json" `
  -d '{"email":"demo@test.com","password":"demo123"}'
```

---

## 🚀 Next Steps

Once Auth Service is working:
1. **Confirm** all tests pass
2. **Check MongoDB** - verify users are stored correctly
3. **Verify** password hashing works
4. Move to **Room & Location Service** implementation

---

## 📞 API Summary

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/health` | GET | No | Service health |
| `/` | GET | No | Service info |
| `/register` | POST | No | Create account |
| `/login` | POST | No | Get JWT token |
| `/verify` | GET | Token | Verify JWT |
| `/me` | GET | Token | Get profile |
| `/me` | PUT | Token | Update profile |

---

**Service Status:** ✅ Complete and ready for testing!

**What to do next:** 
1. Update MongoDB connection string in `.env`
2. Test all endpoints
3. Verify password hashing in database
4. Confirm JWT tokens work correctly

