# API Gateway

Central API Gateway for the Conference Room Booking System. Routes requests to appropriate microservices with rate limiting and health monitoring.

## Features

- **Reverse Proxy** - Routes to all microservices
- **Rate Limiting** - Protects against abuse
- **Health Monitoring** - Checks all service status
- **Error Handling** - Graceful service unavailability
- **CORS Support** - Cross-origin requests enabled
- **Request Logging** - Morgan HTTP logger

## Architecture

```
Client → API Gateway (Port 8000) → Microservices
                 ↓
         ┌───────┴───────┐
         ↓               ↓
    Auth (8001)    Room (8002)
         ↓               ↓
    Booking (8003)  Weather (8004)
         ↓
    Notification (8005)
```

## Routes

All requests go through `http://localhost:8000`

### Authentication
- `POST /auth/register` → Auth Service
- `POST /auth/login` → Auth Service  
- `GET /auth/verify` → Auth Service
- `GET /auth/me` → Auth Service

### Locations
- `GET /locations` → Room Service
- `GET /locations/:id` → Room Service
- `POST /locations` → Room Service (admin)
- `PUT /locations/:id` → Room Service (admin)
- `DELETE /locations/:id` → Room Service (admin)

### Rooms
- `GET /rooms` → Room Service
- `GET /rooms/:id` → Room Service
- `GET /rooms/location/:locationId` → Room Service
- `POST /rooms` → Room Service (admin)
- `PUT /rooms/:id` → Room Service (admin)
- `DELETE /rooms/:id` → Room Service (admin)

### Bookings
- `POST /bookings` → Booking Service (authenticated)
- `GET /bookings/user/:userId` → Booking Service (authenticated)
- `GET /bookings/:id` → Booking Service (authenticated)
- `DELETE /bookings/:id` → Booking Service (authenticated)
- `GET /bookings/room/:roomId/availability` → Booking Service (authenticated)
- `GET /bookings` → Booking Service (admin)

### Weather
- `GET /weather/forecast/:locationId/:date` → Weather Service

### Gateway Endpoints
- `GET /health` - Gateway and all services health
- `GET /` - API documentation

## Rate Limiting

### General Endpoints
- 100 requests per 15 minutes per IP

### Auth Endpoints (login/register)
- 5 requests per 15 minutes per IP
- Only failed requests count

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Gateway port | 8000 |
| AUTH_SERVICE_URL | Auth service URL | http://localhost:8001 |
| ROOM_SERVICE_URL | Room service URL | http://localhost:8002 |
| BOOKING_SERVICE_URL | Booking service URL | http://localhost:8003 |
| WEATHER_SERVICE_URL | Weather service URL | http://localhost:8004 |
| NOTIFICATION_SERVICE_URL | Notification service URL | http://localhost:8005 |
| RATE_LIMIT_WINDOW_MS | Rate limit window | 900000 (15 min) |
| RATE_LIMIT_MAX_REQUESTS | Max requests per window | 100 |
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

3. Update service URLs in `.env`

4. Ensure all services are running

5. Start gateway:
```bash
# Development
npm run dev

# Production
npm start
```

## Docker

Build:
```bash
docker build -t api-gateway .
```

Run:
```bash
docker run -p 8000:8000 \
  -e AUTH_SERVICE_URL=http://auth-service:8001 \
  -e ROOM_SERVICE_URL=http://room-service:8002 \
  -e BOOKING_SERVICE_URL=http://booking-service:8003 \
  -e WEATHER_SERVICE_URL=http://weather-service:8004 \
  -e NOTIFICATION_SERVICE_URL=http://notification-service:8005 \
  api-gateway
```

## Health Check

```bash
curl http://localhost:8000/health
```

**Response:**
```json
{
  "success": true,
  "service": "api-gateway",
  "status": "healthy",
  "services": {
    "auth": { "status": "healthy", "url": "http://localhost:8001" },
    "room": { "status": "healthy", "url": "http://localhost:8002" },
    "booking": { "status": "healthy", "url": "http://localhost:8003" },
    "weather": { "status": "healthy", "url": "http://localhost:8004" },
    "notification": { "status": "healthy", "url": "http://localhost:8005" }
  }
}
```

## Error Handling

### Service Unavailable (503)
When a microservice is down or unreachable.

### Gateway Timeout (504)
When a microservice takes too long to respond.

### Rate Limit Exceeded (429)
When too many requests from same IP.

## Usage Example

```bash
# Instead of calling services directly:
curl http://localhost:8001/login

# Use the gateway:
curl http://localhost:8000/auth/login
```

## Benefits

1. **Single Entry Point** - Clients only need one URL
2. **Rate Protection** - Prevents API abuse
3. **Service Discovery** - Gateway knows all service locations
4. **Health Monitoring** - Check all services at once
5. **Simplified CORS** - Configure once at gateway level
6. **Load Balancing** - Can add multiple instances per service
7. **Authentication** - Can add JWT verification at gateway level

## Project Structure

```
api-gateway/
├── src/
│   ├── config/
│   │   └── services.js          # Service URLs
│   ├── middleware/
│   │   ├── rateLimiter.js       # Rate limiting
│   │   ├── errorHandler.js      # Error handling
│   │   └── notFound.js          # 404 handler
│   ├── routes/
│   │   └── proxyRoutes.js       # Proxy configuration
│   ├── app.js                   # Express app
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
- **http-proxy-middleware**: Proxy functionality
- **express-rate-limit**: Rate limiting
- **axios**: Service health checks
- **cors**: Cross-origin support
- **morgan**: Request logging
- **dotenv**: Environment variables

## Notes

- Gateway should be the only publicly exposed service
- All other services can be internal/private
- Health check pings all services (can be slow if many services)
- Rate limits are per IP address
- Failed auth attempts don't count toward rate limit
- Proxy preserves request headers and body
- Gateway logs all proxied requests

