// Conference Room Booking System - Comprehensive Test Script
// Tests all services and complete booking flow

const axios = require('axios');
const colors = require('colors');

const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:8000';

// Configure axios defaults with timeout
axios.defaults.timeout = 30000; // 30 seconds timeout

let testsPassed = 0;
let testsFailed = 0;
let adminToken = '';
let userToken = '';
let adminUserId = '';
let regularUserId = '';
let locationId = '';
let roomId = '';
let bookingId = '';

// Helper Functions
function printHeader(text) {
  console.log('\n' + '='.repeat(80).cyan);
  console.log(text.cyan);
  console.log('='.repeat(80).cyan);
}

function printStep(number, text) {
  console.log(`\n[${number}] ${text}`.yellow);
}

function printSuccess(text) {
  console.log(`✓ ${text}`.green);
  testsPassed++;
}

function printFailure(text, error = '') {
  console.log(`✗ ${text}`.red);
  if (error) {
    console.log(`  Error: ${error}`.red);
  }
  testsFailed++;
}

async function apiCall(method, url, data = null, headers = {}, expectFailure = false) {
  try {
    const config = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: 30000 // 30 second timeout
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    
    if (expectFailure) {
      printFailure(`Expected failure but call succeeded: ${url}`);
      return null;
    }
    
    return response.data;
  } catch (error) {
    if (expectFailure) {
      printSuccess(`Expected failure occurred: ${url}`);
      return error.response?.data || { error: error.message };
    }
    
    throw error;
  }
}

// Test Functions
async function testHealthChecks() {
  printStep(1, 'Testing Health Checks');
  
  try {
    const health = await apiCall('GET', `${API_GATEWAY_URL}/health`);
    if (health.success) {
      printSuccess('API Gateway health check');
    } else {
      printFailure('API Gateway health check');
    }
  } catch (error) {
    printFailure('API Gateway health check', error.message);
    throw new Error('Services are not running. Please start with: docker-compose up -d');
  }
  
  // Test other service health checks (direct to services)
  const services = [
    { url: 'http://localhost:8001/health', name: 'Auth Service' },
    { url: 'http://localhost:8002/health', name: 'Room & Location Service' },
    { url: 'http://localhost:8003/health', name: 'Booking Service' },
    { url: 'http://localhost:8004/health', name: 'Weather Service' },
    { url: 'http://localhost:8005/health', name: 'Notification Service' }
  ];
  
  for (const service of services) {
    try {
      await apiCall('GET', service.url);
      printSuccess(`${service.name} health check`);
    } catch (error) {
      printFailure(`${service.name} health check`, error.message);
    }
  }
}

async function testUserRegistration() {
  printStep(2, 'Testing User Registration');
  
  const adminEmail = `admin-${Date.now()}@test.com`;
  const userEmail = `user-${Date.now()}@test.com`;
  
  // Register Admin
  try {
    const adminData = await apiCall('POST', `${API_GATEWAY_URL}/auth/register`, {
      email: adminEmail,
      password: 'adminpass123',
      name: 'Test Admin',
      role: 'admin'
    });
    
    if (adminData.data && adminData.data.token) {
      adminToken = adminData.data.token;
      adminUserId = adminData.data.user.id;
      printSuccess(`Admin registered: ${adminEmail}`);
    } else {
      printFailure('Admin registration - no token returned');
    }
  } catch (error) {
    printFailure('Admin registration', error.response?.data?.error || error.message);
  }
  
  // Register Regular User
  try {
    const userData = await apiCall('POST', `${API_GATEWAY_URL}/auth/register`, {
      email: userEmail,
      password: 'userpass123',
      name: 'Test User',
      role: 'user'
    });
    
    if (userData.data && userData.data.token) {
      userToken = userData.data.token;
      regularUserId = userData.data.user.id;
      printSuccess(`User registered: ${userEmail}`);
    } else {
      printFailure('User registration - no token returned');
    }
  } catch (error) {
    printFailure('User registration', error.response?.data?.error || error.message);
  }
}

async function testAuthService() {
  printStep(3, 'Testing Auth Service');
  
  // Verify Admin Token
  try {
    const verifyAdmin = await apiCall('GET', `${API_GATEWAY_URL}/auth/verify`, null, {
      Authorization: `Bearer ${adminToken}`
    });
    
    if (verifyAdmin.data && verifyAdmin.data.user && verifyAdmin.data.user.role === 'admin') {
      printSuccess('Admin token verification');
    } else {
      printFailure('Admin token verification - wrong role');
    }
  } catch (error) {
    printFailure('Admin token verification', error.response?.data?.error || error.message);
  }
  
  // Get Admin Profile
  try {
    const adminProfile = await apiCall('GET', `${API_GATEWAY_URL}/auth/me`, null, {
      Authorization: `Bearer ${adminToken}`
    });
    
    if (adminProfile.data && adminProfile.data.user && adminProfile.data.user.role === 'admin') {
      printSuccess('Admin profile retrieval');
    } else {
      printFailure('Admin profile retrieval');
    }
  } catch (error) {
    printFailure('Admin profile retrieval', error.response?.data?.error || error.message);
  }
  
  // Verify User Token
  try {
    const verifyUser = await apiCall('GET', `${API_GATEWAY_URL}/auth/verify`, null, {
      Authorization: `Bearer ${userToken}`
    });
    
    if (verifyUser.data && verifyUser.data.user && verifyUser.data.user.role === 'user') {
      printSuccess('User token verification');
    } else {
      printFailure('User token verification - wrong role');
    }
  } catch (error) {
    printFailure('User token verification', error.response?.data?.error || error.message);
  }
  
  // Test Invalid Token
  try {
    await apiCall('GET', `${API_GATEWAY_URL}/auth/verify`, null, {
      Authorization: 'Bearer invalid-token-here'
    }, true);
  } catch (error) {
    printSuccess('Invalid token rejection');
  }
}

async function testRoomService() {
  printStep(4, 'Testing Room & Location Service');
  
  // Create Location (Admin) with unique name
  const timestamp = Date.now();
  try {
    const locationData = await apiCall('POST', `${API_GATEWAY_URL}/locations`, {
      name: `Test Location ${timestamp}`,
      address: '123 Test Street',
      city: 'Test City',
      country: 'Testland'
    }, {
      Authorization: `Bearer ${adminToken}`
    });
    
    if (locationData.data && locationData.data._id) {
      locationId = locationData.data._id;
      printSuccess(`Location created: ${locationId}`);
    } else {
      printFailure('Location creation - no ID returned');
    }
  } catch (error) {
    printFailure('Location creation', error.response?.data?.error || error.message);
    // Try to get an existing location to continue tests
    try {
      const locations = await apiCall('GET', `${API_GATEWAY_URL}/locations`);
      if (locations.data && locations.data.length > 0) {
        locationId = locations.data[0]._id;
      }
    } catch (e) {
      // Ignore
    }
  }
  
  // Create Room (Admin)
  if (locationId) {
    try {
      const roomData = await apiCall('POST', `${API_GATEWAY_URL}/rooms`, {
        name: `Conference Room ${timestamp}`,
        locationId: locationId,
        capacity: 12,
        basePrice: 100,
        amenities: ['Projector', 'Whiteboard', 'Video Conference']
      }, {
        Authorization: `Bearer ${adminToken}`
      });
      
      if (roomData.data && roomData.data._id) {
        roomId = roomData.data._id;
        printSuccess(`Room created: ${roomId}`);
      } else {
        printFailure('Room creation - no ID returned');
      }
    } catch (error) {
      printFailure('Room creation', error.response?.data?.error || error.message);
      // Try to get an existing room to continue tests
      try {
        const rooms = await apiCall('GET', `${API_GATEWAY_URL}/rooms`);
        if (rooms.data && rooms.data.length > 0) {
          roomId = rooms.data[0]._id;
        }
      } catch (e) {
        // Ignore
      }
    }
  } else {
    printFailure('Room creation - no location available');
  }
  
  // Get All Locations (Public)
  try {
    const locations = await apiCall('GET', `${API_GATEWAY_URL}/locations`);
    if (locations.data && Array.isArray(locations.data)) {
      printSuccess(`Get all locations (${locations.data.length} found)`);
    } else {
      printFailure('Get all locations');
    }
  } catch (error) {
    printFailure('Get all locations', error.response?.data?.error || error.message);
  }
  
  // Get Specific Location (Public)
  try {
    const location = await apiCall('GET', `${API_GATEWAY_URL}/locations/${locationId}`);
    if (location.data && location.data._id === locationId) {
      printSuccess('Get specific location');
    } else {
      printFailure('Get specific location');
    }
  } catch (error) {
    printFailure('Get specific location', error.response?.data?.error || error.message);
  }
  
  // Get All Rooms (Public)
  try {
    const rooms = await apiCall('GET', `${API_GATEWAY_URL}/rooms`);
    if (rooms.data && Array.isArray(rooms.data)) {
      printSuccess(`Get all rooms (${rooms.data.length} found)`);
    } else {
      printFailure('Get all rooms');
    }
  } catch (error) {
    printFailure('Get all rooms', error.response?.data?.error || error.message);
  }
  
  // Get Rooms by Location (Public)
  try {
    const rooms = await apiCall('GET', `${API_GATEWAY_URL}/rooms?locationId=${locationId}`);
    if (rooms.data && Array.isArray(rooms.data)) {
      printSuccess('Get rooms by location');
    } else {
      printFailure('Get rooms by location');
    }
  } catch (error) {
    printFailure('Get rooms by location', error.response?.data?.error || error.message);
  }
  
  // Test Non-Admin Cannot Create Location
  try {
    await apiCall('POST', `${API_GATEWAY_URL}/locations`, {
      name: 'Unauthorized Location',
      address: '456 Hack St',
      city: 'Bad City',
      country: 'Testland'
    }, {
      Authorization: `Bearer ${userToken}`
    }, true);
  } catch (error) {
    printSuccess('Non-admin location creation blocked');
  }
}

async function testWeatherService() {
  printStep(5, 'Testing Weather Service');
  
  const testDate = new Date();
  testDate.setDate(testDate.getDate() + 15);
  const dateStr = testDate.toISOString().split('T')[0];
  
  // Use locationId if available, otherwise get first location from DB
  let testLocationId = locationId;
  if (!testLocationId) {
    try {
      const locations = await apiCall('GET', `${API_GATEWAY_URL}/locations`);
      if (locations.data && locations.data.length > 0) {
        testLocationId = locations.data[0]._id;
      }
    } catch (error) {
      printFailure('Weather forecast - no location available', error.message);
      return;
    }
  }
  
  try {
    const weather = await apiCall('GET', `${API_GATEWAY_URL}/weather/forecast/${testLocationId}/${dateStr}`);
    
    if (weather.data && typeof weather.data.temperature === 'number') {
      printSuccess(`Weather forecast: ${weather.data.temperature}°C (deviation: ${weather.data.deviation})`);
    } else {
      printFailure('Weather forecast - invalid data');
    }
  } catch (error) {
    printFailure('Weather forecast', error.response?.data?.error || error.message);
  }
}

async function testBookingService() {
  printStep(6, 'Testing Booking Service');
  
  const bookingDate = new Date();
  bookingDate.setDate(bookingDate.getDate() + 30);
  const dateStr = bookingDate.toISOString().split('T')[0];
  
  // Ensure we have a roomId
  let testRoomId = roomId;
  if (!testRoomId) {
    try {
      const rooms = await apiCall('GET', `${API_GATEWAY_URL}/rooms`);
      if (rooms.data && rooms.data.length > 0) {
        testRoomId = rooms.data[0]._id;
      }
    } catch (error) {
      printFailure('Booking creation - no room available', error.message);
      return;
    }
  }
  
  // Create Booking (User)
  try {
    const bookingData = await apiCall('POST', `${API_GATEWAY_URL}/bookings`, {
      roomId: testRoomId,
      date: dateStr
    }, {
      Authorization: `Bearer ${userToken}`
    });
    
    if (bookingData.data && bookingData.data.booking && bookingData.data.booking._id) {
      bookingId = bookingData.data.booking._id;
      const adjustedPrice = bookingData.data.priceBreakdown?.adjustedPrice;
      printSuccess(`Booking created: ${bookingId} (Price: $${adjustedPrice})`);
    } else {
      printFailure('Booking creation - no ID returned');
    }
  } catch (error) {
    printFailure('Booking creation', error.response?.data?.error || error.message);
  }
  
  // Try to book same room/date (should fail)
  try {
    await apiCall('POST', `${API_GATEWAY_URL}/bookings`, {
      roomId: roomId,
      date: dateStr
    }, {
      Authorization: `Bearer ${userToken}`
    }, true);
  } catch (error) {
    printSuccess('Duplicate booking prevented');
  }
  
  // Get User's Bookings
  try {
    const bookings = await apiCall('GET', `${API_GATEWAY_URL}/bookings/user/${regularUserId}`, null, {
      Authorization: `Bearer ${userToken}`
    });
    
    if (bookings.data && Array.isArray(bookings.data)) {
      printSuccess(`Get user bookings (${bookings.data.length} found)`);
    } else {
      printFailure('Get user bookings');
    }
  } catch (error) {
    printFailure('Get user bookings', error.response?.data?.error || error.message);
  }
  
  // Get Specific Booking
  try {
    const booking = await apiCall('GET', `${API_GATEWAY_URL}/bookings/${bookingId}`, null, {
      Authorization: `Bearer ${userToken}`
    });
    
    if (booking.data && booking.data._id === bookingId) {
      printSuccess('Get specific booking');
    } else {
      printFailure('Get specific booking');
    }
  } catch (error) {
    printFailure('Get specific booking', error.response?.data?.error || error.message);
  }
  
  // Get Bookings by Room
  try {
    const bookings = await apiCall('GET', `${API_GATEWAY_URL}/bookings/room/${roomId}`, null, {
      Authorization: `Bearer ${adminToken}`
    });
    
    if (bookings.data && Array.isArray(bookings.data)) {
      printSuccess('Get bookings by room');
    } else {
      printFailure('Get bookings by room');
    }
  } catch (error) {
    printFailure('Get bookings by room', error.response?.data?.error || error.message);
  }
  
  // Cancel Booking (User)
  try {
    const cancelData = await apiCall('DELETE', `${API_GATEWAY_URL}/bookings/${bookingId}`, null, {
      Authorization: `Bearer ${userToken}`
    });
    
    if (cancelData.success) {
      printSuccess('Booking cancelled');
    } else {
      printFailure('Booking cancellation');
    }
  } catch (error) {
    printFailure('Booking cancellation', error.response?.data?.error || error.message);
  }
  
  // Verify booking is cancelled (should fail)
  try {
    await apiCall('GET', `${API_GATEWAY_URL}/bookings/${bookingId}`, null, {
      Authorization: `Bearer ${userToken}`
    }, true);
  } catch (error) {
    printSuccess('Cancelled booking not retrievable');
  }
  
  // Test booking in the past (should fail)
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 1);
  const pastDateStr = pastDate.toISOString().split('T')[0];
  
  try {
    await apiCall('POST', `${API_GATEWAY_URL}/bookings`, {
      roomId: roomId,
      date: pastDateStr
    }, {
      Authorization: `Bearer ${userToken}`
    }, true);
  } catch (error) {
    printSuccess('Past date booking prevented');
  }
}

async function testNotificationService() {
  printStep(7, 'Testing Notification Service');
  
  try {
    const notifyData = await apiCall('POST', `${API_GATEWAY_URL}/notifications/notify`, {
      type: 'booking_confirmation',
      booking: {
        userEmail: 'test@example.com',
        userName: 'Test User',
        roomName: 'Test Room',
        locationName: 'Test Location',
        date: '2026-01-15',
        basePrice: 100,
        temperature: 22,
        deviation: 1,
        adjustedPrice: 105,
        bookingId: 'test-booking-123'
      }
    }, {
      Authorization: `Bearer ${adminToken}`
    });
    
    if (notifyData.success) {
      printSuccess('Notification sent successfully');
    } else {
      printFailure('Notification sending');
    }
  } catch (error) {
    printFailure('Notification sending', error.response?.data?.error || error.message);
  }
}

// Main Test Runner
async function runAllTests() {
  printHeader('🧪 Conference Room Booking System - Comprehensive Test Suite');
  console.log(`Testing API Gateway at: ${API_GATEWAY_URL}\n`.cyan);
  
  const startTime = Date.now();
  
  try {
    await testHealthChecks();
    await testUserRegistration();
    await testAuthService();
    await testRoomService();
    await testWeatherService();
    await testBookingService();
    await testNotificationService();
  } catch (error) {
    console.error('\n' + '❌ Fatal Error:'.red, error.message);
    process.exit(1);
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  // Print Summary
  printHeader('📊 Test Summary');
  console.log(`Total Tests: ${testsPassed + testsFailed}`.cyan);
  console.log(`Passed: ${testsPassed}`.green);
  console.log(`Failed: ${testsFailed}`.red);
  console.log(`Duration: ${duration}s`.cyan);
  console.log('='.repeat(80).cyan);
  
  if (testsFailed === 0) {
    console.log('\n✅ All tests passed! System is working correctly.\n'.green.bold);
    process.exit(0);
  } else {
    console.log(`\n❌ ${testsFailed} test(s) failed. Please review the errors above.\n`.red.bold);
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('Unexpected error:'.red, error);
  process.exit(1);
});

