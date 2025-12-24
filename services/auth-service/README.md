# Authentication Service

JWT-based authentication and authorization service for the Conference Room Booking System.

## Features

- User registration with bcrypt password hashing
- JWT token-based authentication
- Token verification and validation
- User profile management
- Role-based access control (user/admin)
- MongoDB integration with Mongoose
- Input validation with express-validator
- Secure password storage

## API Endpoints

### Register User
```
POST /register
```
Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "user"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user",
      "createdAt": "2025-12-17T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Login
```
POST /login
```
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Verify Token
```
GET /verify
```
Verify if a JWT token is valid.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user"
    },
    "tokenData": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "role": "user",
      "iat": 1702814400,
      "exp": 1703419200
    }
  }
}
```

### Get Profile (Protected)
```
GET /me
```
Get current user's profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user",
      "isActive": true,
      "createdAt": "2025-12-17T10:30:00.000Z",
      "updatedAt": "2025-12-17T10:30:00.000Z"
    }
  }
}
```

### Update Profile (Protected)
```
PUT /me
```
Update current user's profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "John Smith"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "name": "John Smith",
      "role": "user"
    }
  }
}
```

### Health Check
```
GET /health
```
Returns service health status.

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| PORT | Service port | 8001 | No |
| MONGODB_URI | MongoDB connection string | - | Yes |
| JWT_SECRET | Secret key for JWT signing | - | Yes |
| JWT_EXPIRE | Token expiration time | 7d | No |
| NODE_ENV | Environment | development | No |

## Database Schema

### User Model

```javascript
{
  email: String (unique, required),
  password: String (hashed, required),
  name: String (required, 2-50 chars),
  role: String (enum: ['user', 'admin'], default: 'user'),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
```env
PORT=8001
NODE_ENV=development
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/conference-booking
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
```

4. Run the service:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## Security Features

- **Password Hashing**: bcrypt with salt rounds (10)
- **JWT Tokens**: Signed with secret key, configurable expiration
- **Token Verification**: Validates token signature and expiration
- **Input Validation**: Email format, password length, name constraints
- **Protected Routes**: Middleware for authentication and authorization
- **Role-Based Access**: Support for user and admin roles

## Docker

Build image:
```bash
docker build -t auth-service .
```

Run container:
```bash
docker run -p 8001:8001 \
  -e MONGODB_URI=mongodb+srv://... \
  -e JWT_SECRET=your-secret \
  auth-service
```

## Project Structure

```
auth-service/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── controllers/
│   │   └── authController.js    # Authentication logic
│   ├── models/
│   │   └── User.js              # User schema
│   ├── middleware/
│   │   ├── auth.js              # JWT middleware
│   │   ├── validators.js        # Input validation
│   │   ├── errorHandler.js      # Error handling
│   │   └── notFound.js          # 404 handler
│   ├── utils/
│   │   └── jwt.js               # JWT utilities
│   ├── routes/
│   │   └── authRoutes.js        # API routes
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
- **mongoose**: MongoDB ODM
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT implementation
- **express-validator**: Input validation
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment variables
- **morgan**: HTTP request logger

## Error Handling

The service provides detailed error messages:

- `400 Bad Request`: Validation errors, duplicate entries
- `401 Unauthorized`: Invalid credentials, missing/invalid token
- `403 Forbidden`: Insufficient permissions, deactivated account
- `404 Not Found`: User or route not found
- `500 Internal Server Error`: Server-side errors

## Integration with Other Services

Other microservices can verify JWT tokens by:

1. **Using the /verify endpoint** (recommended):
```javascript
const response = await fetch('http://auth-service:8001/verify', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

2. **Using the JWT secret directly** (if shared):
```javascript
const jwt = require('jsonwebtoken');
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

## Notes

- Passwords are automatically hashed before saving
- Passwords are never returned in API responses
- Tokens expire after configured time (default: 7 days)
- Users can be deactivated without deletion (isActive: false)
- Email addresses are stored in lowercase
- Role can be 'user' or 'admin'

