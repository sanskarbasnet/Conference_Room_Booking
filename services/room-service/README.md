# Room and Location Service

Manages locations and conference rooms for the Conference Room Booking System.

## Features

- Location management (CRUD operations)
- Conference room management (CRUD operations)
- Room filtering by location, capacity, and price
- Integration with Auth Service for admin operations
- MongoDB integration with Mongoose
- Input validation
- Role-based access control

## API Endpoints

### Locations

#### Get All Locations
```
GET /locations?city=London&country=UK&active=true
```
List all locations with optional filters.

**Query Parameters:**
- `city` (optional): Filter by city
- `country` (optional): Filter by country
- `active` (optional): Filter by active status

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "London Office",
      "address": "123 Business Street",
      "city": "London",
      "country": "UK",
      "description": "Main office location",
      "isActive": true,
      "roomCount": 3,
      "createdAt": "2025-12-17T10:30:00.000Z"
    }
  ]
}
```

#### Get Location by ID
```
GET /locations/:id
```
Get specific location with its rooms.

**Response:**
```json
{
  "success": true,
  "data": {
    "location": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "London Office",
      "address": "123 Business Street",
      "city": "London",
      "country": "UK"
    },
    "rooms": [...],
    "roomCount": 3
  }
}
```

#### Create Location (Admin Only)
```
POST /locations
Headers: Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "name": "London Office",
  "address": "123 Business Street",
  "city": "London",
  "country": "UK",
  "description": "Main office location"
}
```

#### Update Location (Admin Only)
```
PUT /locations/:id
Headers: Authorization: Bearer <admin_token>
```

#### Delete Location (Admin Only)
```
DELETE /locations/:id
Headers: Authorization: Bearer <admin_token>
```
Note: Cannot delete location with existing rooms.

---

### Rooms

#### Get All Rooms
```
GET /rooms?locationId=xxx&minCapacity=10&maxCapacity=50&minPrice=100&maxPrice=500
```
List all rooms with optional filters.

**Query Parameters:**
- `locationId` (optional): Filter by location
- `minCapacity` (optional): Minimum capacity
- `maxCapacity` (optional): Maximum capacity
- `minPrice` (optional): Minimum base price
- `maxPrice` (optional): Maximum base price
- `active` (optional): Filter by active status

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Conference Room A",
      "locationId": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "London Office",
        "city": "London",
        "country": "UK"
      },
      "capacity": 20,
      "basePrice": 250,
      "amenities": ["Projector", "Whiteboard", "Video Conference"],
      "floor": 3,
      "isActive": true
    }
  ]
}
```

#### Get Room by ID
```
GET /rooms/:id
```

#### Get Rooms by Location
```
GET /rooms/location/:locationId
```
Get all active rooms for a specific location.

#### Create Room (Admin Only)
```
POST /rooms
Headers: Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "name": "Conference Room A",
  "locationId": "507f1f77bcf86cd799439011",
  "capacity": 20,
  "basePrice": 250,
  "amenities": ["Projector", "Whiteboard", "Video Conference"],
  "description": "Large conference room with modern amenities",
  "floor": 3
}
```

#### Update Room (Admin Only)
```
PUT /rooms/:id
Headers: Authorization: Bearer <admin_token>
```

#### Delete Room (Admin Only)
```
DELETE /rooms/:id
Headers: Authorization: Bearer <admin_token>
```

---

## Database Schemas

### Location Model

```javascript
{
  name: String (required, 2-100 chars),
  address: String (required),
  city: String (required),
  country: String (required),
  description: String (optional, max 500 chars),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### Room Model

```javascript
{
  name: String (required, 2-100 chars),
  locationId: ObjectId (ref: Location, required),
  capacity: Number (required, 1-1000),
  basePrice: Number (required, min: 0),
  amenities: [String] (optional),
  description: String (optional, max 500 chars),
  floor: Number (optional, min: 0),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| PORT | Service port | 8002 | No |
| MONGODB_URI | MongoDB connection string | - | Yes |
| AUTH_SERVICE_URL | Auth service URL for token verification | http://localhost:8001 | No |
| NODE_ENV | Environment | development | No |

## Authentication

### Public Endpoints (No Auth Required)
- `GET /locations`
- `GET /locations/:id`
- `GET /rooms`
- `GET /rooms/:id`
- `GET /rooms/location/:locationId`

### Admin-Only Endpoints (Requires Admin Token)
- `POST /locations`
- `PUT /locations/:id`
- `DELETE /locations/:id`
- `POST /rooms`
- `PUT /rooms/:id`
- `DELETE /rooms/:id`

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
PORT=8002
NODE_ENV=development
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/conference-booking
AUTH_SERVICE_URL=http://localhost:8001
```

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
docker build -t room-service .
```

Run container:
```bash
docker run -p 8002:8002 \
  -e MONGODB_URI=mongodb+srv://... \
  -e AUTH_SERVICE_URL=http://auth-service:8001 \
  room-service
```

## Project Structure

```
room-service/
├── src/
│   ├── config/
│   │   └── database.js              # MongoDB connection
│   ├── controllers/
│   │   ├── locationController.js    # Location logic
│   │   └── roomController.js        # Room logic
│   ├── models/
│   │   ├── Location.js              # Location schema
│   │   └── Room.js                  # Room schema
│   ├── middleware/
│   │   ├── auth.js                  # Auth verification
│   │   ├── validators.js            # Input validation
│   │   ├── errorHandler.js          # Error handling
│   │   └── notFound.js              # 404 handler
│   ├── routes/
│   │   ├── locationRoutes.js        # Location endpoints
│   │   └── roomRoutes.js            # Room endpoints
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
- **axios**: HTTP client (for Auth Service communication)
- **express-validator**: Input validation
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment variables
- **morgan**: HTTP request logger

## Integration with Other Services

### Auth Service Integration
Admin operations require JWT token verification:
```javascript
// Middleware verifies token with Auth Service
Authorization: Bearer <token>
```

### Used by Booking Service
Booking Service calls this service to:
- Verify room exists
- Get room details (capacity, basePrice)
- Check room availability

## Error Handling

- `400 Bad Request`: Validation errors, invalid IDs
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions (non-admin)
- `404 Not Found`: Location or room not found
- `500 Internal Server Error`: Server-side errors

## Notes

- All prices are in USD (or your currency)
- Capacity is number of people
- Amenities are free-text strings
- Floor numbering starts from 0 (ground floor)
- Locations with rooms cannot be deleted
- Room names must be unique within a location

