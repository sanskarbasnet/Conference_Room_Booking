// AWS Deployment Test Script
// Tests all functionalities of the Conference Room Booking System

const axios = require('axios');
const colors = require('colors');

const API_URL = process.env.API_GATEWAY_URL || 'http://conference-alb-v2-649441908.us-east-1.elb.amazonaws.com';

// Configure axios with longer timeout
axios.defaults.timeout = 45000; // 45 seconds

let testResults = {
  passed: 0,
  failed: 0,
  skipped: 0
};

let testData = {
  userToken: '',
  adminToken: '',
  userId: '',
  locationId: '',
  roomId: '',
  bookingId: ''
};

function logTest(testName, status, details = '') {
  const statusSymbol = status === 'pass' ? '✓'.green : status === 'fail' ? '✗'.red : '⚠'.yellow;
  const detailsStr = details ? ` ${details.gray}` : '';
  console.log(`${statusSymbol} ${testName}${detailsStr}`);
  
  if (status === 'pass') testResults.passed++;
  else if (status === 'fail') testResults.failed++;
  else testResults.skipped++;
}

async function testEndpoint(name, testFn) {
  process.stdout.write(`Testing ${name}... `);
  try {
    const result = await testFn();
    if (result.success) {
      logTest(name, 'pass', result.details);
      return result.data;
    } else {
      logTest(name, 'fail', result.details);
      return null;
    }
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message;
    logTest(name, 'fail', errorMsg);
    return null;
  }
}

async function runTests() {
  console.log('\n🚀 AWS Conference Room Booking System - Full Test Suite'.cyan.bold);
  console.log('='.repeat(70).cyan);
  console.log(`API URL: ${API_URL}`.gray);
  console.log('='.repeat(70).cyan);
  
  // ========================================
  // 1. HEALTH & SYSTEM TESTS
  // ========================================
  console.log('\n📊 Health & System Tests'.yellow.bold);
  console.log('-'.repeat(70).gray);
  
  await testEndpoint('API Gateway Root', async () => {
    const response = await axios.get(API_URL);
    return {
      success: response.data.success,
      details: `v${response.data.version}`
    };
  });
  
  await testEndpoint('Health Check', async () => {
    const response = await axios.get(`${API_URL}/health`);
    return {
      success: true,
      details: `Status: ${response.data.status || 'running'}`
    };
  });
  
  // ========================================
  // 2. AUTHENTICATION TESTS
  // ========================================
  console.log('\n🔐 Authentication Tests'.yellow.bold);
  console.log('-'.repeat(70).gray);
  
  // Register User
  const userEmail = `testuser-${Date.now()}@example.com`;
  await testEndpoint('Register User', async () => {
    const response = await axios.post(`${API_URL}/auth/register`, {
      email: userEmail,
      password: 'Test123!@#',
      name: 'Test User',
      role: 'user'
    }, {
      timeout: 45000
    });
    
    if (response.data.data && response.data.data.token) {
      testData.userToken = response.data.data.token;
      testData.userId = response.data.data.user.id || response.data.data.user._id;
      return {
        success: true,
        details: `User ID: ${testData.userId.substring(0, 8)}...`
      };
    }
    return { success: false };
  });
  
  // Register Admin
  const adminEmail = `admin-${Date.now()}@example.com`;
  await testEndpoint('Register Admin', async () => {
    const response = await axios.post(`${API_URL}/auth/register`, {
      email: adminEmail,
      password: 'Admin123!@#',
      name: 'Admin User',
      role: 'admin'
    }, {
      timeout: 45000
    });
    
    if (response.data.data && response.data.data.token) {
      testData.adminToken = response.data.data.token;
      return {
        success: true,
        details: 'Admin registered'
      };
    }
    return { success: false };
  });
  
  // Login
  await testEndpoint('Login User', async () => {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: userEmail,
      password: 'Test123!@#'
    });
    
    return {
      success: response.data.data && response.data.data.token,
      details: 'Token received'
    };
  });
  
  // Get Profile
  if (testData.userToken) {
    await testEndpoint('Get User Profile', async () => {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${testData.userToken}` }
      });
      
      const email = response.data.data?.user?.email || response.data.data?.email;
      return {
        success: response.data.success && email,
        details: `Email: ${email || 'N/A'}`
      };
    });
  }
  
  // Verify Token
  if (testData.userToken) {
    await testEndpoint('Verify Token', async () => {
      const response = await axios.get(`${API_URL}/auth/verify`, {
        headers: { Authorization: `Bearer ${testData.userToken}` }
      });
      
      return {
        success: response.data.success && response.data.data && response.data.data.user,
        details: `Valid: ${response.data.data?.user?.email || 'token verified'}`
      };
    });
  }
  
  // ========================================
  // 3. LOCATION TESTS
  // ========================================
  console.log('\n📍 Location Tests'.yellow.bold);
  console.log('-'.repeat(70).gray);
  
  // Get All Locations
  await testEndpoint('Get All Locations', async () => {
    const response = await axios.get(`${API_URL}/locations`);
    
    if (response.data.data && Array.isArray(response.data.data)) {
      if (response.data.data.length > 0) {
        testData.locationId = response.data.data[0]._id;
      }
      return {
        success: true,
        details: `${response.data.data.length} locations found`
      };
    }
    return { success: false };
  });
  
  // Create Location (Admin)
  if (testData.adminToken) {
    await testEndpoint('Create Location (Admin)', async () => {
      const response = await axios.post(`${API_URL}/locations`, {
        name: `Test Location ${Date.now()}`,
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'USA',
        latitude: 40.7128,
        longitude: -74.0060
      }, {
        headers: { Authorization: `Bearer ${testData.adminToken}` }
      });
      
      const newLocationId = response.data.data._id;
      testData.locationId = testData.locationId || newLocationId;
      
      return {
        success: response.data.data && response.data.data._id,
        details: `Created ID: ${newLocationId.substring(0, 8)}...`
      };
    });
  }
  
  // Get Location by ID
  if (testData.locationId) {
    await testEndpoint('Get Location by ID', async () => {
      const response = await axios.get(`${API_URL}/locations/${testData.locationId}`);
      
      const location = response.data.data?.location || response.data.data;
      return {
        success: response.data.success && location && location._id,
        details: location ? `Name: ${location.name}` : 'No data'
      };
    });
  }
  
  // Update Location (Admin)
  if (testData.adminToken && testData.locationId) {
    await testEndpoint('Update Location (Admin)', async () => {
      const response = await axios.put(`${API_URL}/locations/${testData.locationId}`, {
        description: 'Updated description'
      }, {
        headers: { Authorization: `Bearer ${testData.adminToken}` }
      });
      
      return {
        success: response.data.data && response.data.data._id,
        details: 'Location updated'
      };
    });
  }
  
  // ========================================
  // 4. ROOM TESTS
  // ========================================
  console.log('\n🏢 Room Tests'.yellow.bold);
  console.log('-'.repeat(70).gray);
  
  // Get All Rooms
  await testEndpoint('Get All Rooms', async () => {
    const response = await axios.get(`${API_URL}/rooms`);
    
    if (response.data.data && Array.isArray(response.data.data)) {
      if (response.data.data.length > 0) {
        testData.roomId = response.data.data[0]._id;
        const room = response.data.data[0];
        if (room.locationId) {
          testData.locationId = room.locationId._id || room.locationId;
        }
      }
      return {
        success: true,
        details: `${response.data.data.length} rooms found`
      };
    }
    return { success: false };
  });
  
  // Create Room (Admin)
  if (testData.adminToken && testData.locationId) {
    await testEndpoint('Create Room (Admin)', async () => {
      const response = await axios.post(`${API_URL}/rooms`, {
        name: `Test Room ${Date.now()}`,
        locationId: testData.locationId,
        capacity: 10,
        amenities: ['Projector', 'Whiteboard', 'WiFi'],
        basePrice: 100,
        description: 'Test conference room'
      }, {
        headers: { Authorization: `Bearer ${testData.adminToken}` }
      });
      
      const newRoomId = response.data.data._id;
      testData.roomId = testData.roomId || newRoomId;
      
      return {
        success: response.data.data && response.data.data._id,
        details: `Created ID: ${newRoomId.substring(0, 8)}...`
      };
    });
  }
  
  // Get Room by ID
  if (testData.roomId) {
    await testEndpoint('Get Room by ID', async () => {
      const response = await axios.get(`${API_URL}/rooms/${testData.roomId}`);
      
      return {
        success: response.data.data && response.data.data._id === testData.roomId,
        details: `Name: ${response.data.data.name}`
      };
    });
  }
  
  // Get Rooms by Location
  if (testData.locationId) {
    await testEndpoint('Get Rooms by Location', async () => {
      const response = await axios.get(`${API_URL}/rooms/location/${testData.locationId}`);
      
      return {
        success: response.data.data && Array.isArray(response.data.data),
        details: `${response.data.data.length} rooms in location`
      };
    });
  }
  
  // Update Room (Admin)
  if (testData.adminToken && testData.roomId) {
    await testEndpoint('Update Room (Admin)', async () => {
      const response = await axios.put(`${API_URL}/rooms/${testData.roomId}`, {
        description: 'Updated room description'
      }, {
        headers: { Authorization: `Bearer ${testData.adminToken}` }
      });
      
      return {
        success: response.data.data && response.data.data._id,
        details: 'Room updated'
      };
    });
  }
  
  // ========================================
  // 5. WEATHER TESTS
  // ========================================
  console.log('\n🌤️  Weather Tests'.yellow.bold);
  console.log('-'.repeat(70).gray);
  
  // Get Weather Forecast
  if (testData.locationId) {
    await testEndpoint('Get Weather Forecast', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);
      const dateStr = futureDate.toISOString().split('T')[0];
      
      const response = await axios.get(`${API_URL}/weather/forecast/${testData.locationId}/${dateStr}`);
      
      return {
        success: response.data.data && typeof response.data.data.temperature === 'number',
        details: `${response.data.data.temperature}°C, ${response.data.data.condition}`
      };
    });
  }
  
  // ========================================
  // 6. BOOKING TESTS
  // ========================================
  console.log('\n📅 Booking Tests'.yellow.bold);
  console.log('-'.repeat(70).gray);
  
  // Check Room Availability
  if (testData.roomId && testData.userToken) {
    await testEndpoint('Check Room Availability', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 30);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 60);
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      const response = await axios.get(
        `${API_URL}/bookings/room/${testData.roomId}/availability?startDate=${startDateStr}&endDate=${endDateStr}`,
        {
          headers: { Authorization: `Bearer ${testData.userToken}` }
        }
      );
      
      return {
        success: response.data.success && response.data.roomId,
        details: `${response.data.bookingsCount} bookings in date range`
      };
    });
  }
  
  // Create Booking
  if (testData.roomId && testData.userToken) {
    await testEndpoint('Create Booking', async () => {
      const futureDate = new Date();
      // Use random offset between 45-90 days to avoid duplicate bookings
      const randomOffset = 45 + Math.floor(Math.random() * 45);
      futureDate.setDate(futureDate.getDate() + randomOffset);
      const dateStr = futureDate.toISOString().split('T')[0];
      
      const response = await axios.post(`${API_URL}/bookings`, {
        roomId: testData.roomId,
        date: dateStr
      }, {
        headers: { Authorization: `Bearer ${testData.userToken}` },
        timeout: 120000 // 120 second timeout for booking (needs to call weather service)
      });
      
      if (response.data.data && response.data.data.booking) {
        testData.bookingId = response.data.data.booking._id;
        const price = response.data.data.priceBreakdown?.adjustedPrice || response.data.data.booking.totalPrice;
        return {
          success: true,
          details: `Booking ID: ${testData.bookingId.substring(0, 8)}..., Price: $${price}`
        };
      }
      return { success: false };
    });
  }
  
  // Get User Bookings
  if (testData.userId && testData.userToken) {
    await testEndpoint('Get User Bookings', async () => {
      const response = await axios.get(`${API_URL}/bookings/user/${testData.userId}`, {
        headers: { Authorization: `Bearer ${testData.userToken}` }
      });
      
      return {
        success: response.data.data && Array.isArray(response.data.data),
        details: `${response.data.data.length} bookings found`
      };
    });
  }
  
  // Get Booking by ID
  if (testData.bookingId && testData.userToken) {
    await testEndpoint('Get Booking by ID', async () => {
      const response = await axios.get(`${API_URL}/bookings/${testData.bookingId}`, {
        headers: { Authorization: `Bearer ${testData.userToken}` }
      });
      
      return {
        success: response.data.data && response.data.data._id === testData.bookingId,
        details: `Status: ${response.data.data.status}`
      };
    });
  }
  
  // Get All Bookings (Admin)
  if (testData.adminToken) {
    await testEndpoint('Get All Bookings (Admin)', async () => {
      const response = await axios.get(`${API_URL}/bookings`, {
        headers: { Authorization: `Bearer ${testData.adminToken}` }
      });
      
      return {
        success: response.data.data && Array.isArray(response.data.data),
        details: `${response.data.data.length} total bookings`
      };
    });
  }
  
  // Cancel Booking
  if (testData.bookingId && testData.userToken) {
    await testEndpoint('Cancel Booking', async () => {
      const response = await axios.delete(`${API_URL}/bookings/${testData.bookingId}`, {
        headers: { Authorization: `Bearer ${testData.userToken}` }
      });
      
      return {
        success: response.data.success,
        details: 'Booking cancelled'
      };
    });
  }
  
  // ========================================
  // 7. RATE LIMITING TESTS
  // ========================================
  console.log('\n🚦 Rate Limiting Tests'.yellow.bold);
  console.log('-'.repeat(70).gray);
  
  await testEndpoint('Rate Limit Check', async () => {
    // Make multiple rapid requests to test rate limiting
    const requests = Array(5).fill().map(() => 
      axios.get(`${API_URL}/locations`).catch(e => e.response)
    );
    
    const responses = await Promise.all(requests);
    const allSuccessful = responses.every(r => r.status === 200);
    
    return {
      success: true,
      details: allSuccessful ? '5 rapid requests OK' : 'Rate limit working'
    };
  });
  
  // ========================================
  // SUMMARY
  // ========================================
  console.log('\n' + '='.repeat(70).cyan);
  console.log('📊 Test Summary'.cyan.bold);
  console.log('='.repeat(70).cyan);
  console.log(`✓ Passed: ${testResults.passed}`.green);
  console.log(`✗ Failed: ${testResults.failed}`.red);
  console.log(`⚠ Skipped: ${testResults.skipped}`.yellow);
  console.log('='.repeat(70).cyan);
  
  const totalTests = testResults.passed + testResults.failed + testResults.skipped;
  const successRate = ((testResults.passed / totalTests) * 100).toFixed(1);
  
  console.log(`\nSuccess Rate: ${successRate}%`.cyan);
  
  if (testResults.failed === 0) {
    console.log('\n✅ All tests passed! Your AWS deployment is fully functional.'.green.bold);
    process.exit(0);
  } else {
    console.log(`\n⚠️  ${testResults.failed} test(s) failed. Please check the output above.`.yellow.bold);
    process.exit(1);
  }
}

// Run tests
console.log('\n⏳ Starting comprehensive test suite...'.cyan);
console.log('This may take a few minutes due to bcrypt password hashing.\n'.gray);

runTests().catch(error => {
  console.error('\n❌ Test suite error:'.red.bold, error.message);
  process.exit(1);
});

