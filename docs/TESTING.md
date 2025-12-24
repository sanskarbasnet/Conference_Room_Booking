# Testing Guide

## Individual Service Tests

Each microservice now has its own comprehensive test suite that can be run independently. These tests are designed to work in CI/CD pipelines and can test services whether they're running locally or in a deployed environment.

## Test Files

### Auth Service (`services/auth-service/test.js`)
Tests authentication functionality:
- Health checks
- User registration
- User login
- Token verification
- Profile retrieval
- Input validation
- Error handling

**Run tests:**
```bash
cd services/auth-service
npm test
```

### Room Service (`services/room-service/test.js`)
Tests location and room management:
- Health checks
- Get all locations
- Get location by ID
- Get all rooms
- Get room by ID
- Get rooms by location
- 404 error handling

**Run tests:**
```bash
cd services/room-service
npm test
```

### Booking Service (`services/booking-service/test.js`)
Tests booking functionality:
- Health checks
- Authentication validation
- Input validation
- Error handling (401, 400 responses)

**Run tests:**
```bash
cd services/booking-service
npm test
```

### Weather Service (`services/weather-service/test.js`)
Tests weather forecast endpoints:
- Health checks
- Get forecast for location and date
- Bulk forecasts
- Input validation
- Error handling

**Run tests:**
```bash
cd services/weather-service
npm test
```

### Notification Service (`services/notification-service/test.js`)
Tests notification functionality:
- Health checks
- Test notification endpoint
- Booking confirmation notifications
- Booking cancellation notifications
- Input validation
- Error handling

**Run tests:**
```bash
cd services/notification-service
npm test
```

### API Gateway (`services/api-gateway/test.js`)
Tests gateway routing and health:
- Root endpoint
- Health check (aggregated service health)
- Route to auth service
- Route to room service
- Route to weather service
- Route to notification service
- 404 handling for invalid routes

**Run tests:**
```bash
cd services/api-gateway
npm test
```

## Environment Variables

Tests can be configured using environment variables:

- `AUTH_SERVICE_URL` - Default: `http://localhost:8001`
- `ROOM_SERVICE_URL` - Default: `http://localhost:8002`
- `BOOKING_SERVICE_URL` - Default: `http://localhost:8003`
- `WEATHER_SERVICE_URL` - Default: `http://localhost:8004`
- `NOTIFICATION_SERVICE_URL` - Default: `http://localhost:8005`
- `API_GATEWAY_URL` - Default: `http://localhost:8000`

## CI/CD Integration

The tests are automatically run in the GitHub Actions CI/CD pipeline:

1. **Lint and Test Job** - Runs all service tests before building
2. Tests are run with `npm test` in each service directory
3. Tests gracefully handle services that aren't running (won't fail CI)
4. Tests exit with code 0 on success, 1 on failure

## Test Behavior

### When Service is Running
- Tests make actual HTTP requests to the service
- Validates responses and status codes
- Tests both success and error scenarios

### When Service is Not Running
- Tests detect connection refused errors
- Mark tests as failed but don't crash
- Exit with code 0 if no tests passed (service not available)
- Exit with code 1 if some tests passed but others failed

## Running All Tests

To run all service tests:

```bash
# From project root
for service in auth-service room-service booking-service weather-service notification-service api-gateway; do
  echo "Testing $service..."
  cd services/$service
  npm test
  cd ../..
done
```

Or use the comprehensive test scripts in the `scripts/` directory:
- `scripts/test-system.js` - Full system integration tests
- `scripts/test-aws.js` - AWS deployment tests
- `scripts/test-quick.js` - Quick smoke tests

## Test Output

Each test suite provides:
- ✓ Passed tests (green)
- ✗ Failed tests (red)
- ⚠ Skipped tests (yellow)
- Summary with success rate
- Exit code (0 for success, 1 for failure)

## Dependencies

All test files require:
- `axios` - For HTTP requests
- `colors` - For colored terminal output

These are added as `devDependencies` in each service's `package.json`.

