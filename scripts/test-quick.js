// Quick Smoke Test - Fast validation of core functionality

const axios = require('axios');
const colors = require('colors');

const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:8000';

// Configure axios defaults with timeout
axios.defaults.timeout = 30000; // 30 seconds timeout

async function quickTest() {
  console.log('🚀 Quick Smoke Test'.cyan.bold);
  console.log('='.repeat(60).cyan);
  console.log(`Testing: ${API_GATEWAY_URL}\n`.gray);
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Health Check
  process.stdout.write('1. API Gateway Health... ');
  try {
    const health = await axios.get(`${API_GATEWAY_URL}/health`);
    if (health.data.success) {
      console.log('✓'.green);
      passed++;
    } else {
      console.log('✗'.red);
      failed++;
    }
  } catch (error) {
    console.log('✗ (Not running)'.red);
    console.error('\n❌ Services are not running. Start with: docker-compose up -d\n'.red);
    process.exit(1);
  }
  
  // Test 2: Service Health Checks (direct to services)
  const services = [
    { url: 'http://localhost:8001/health', name: 'Auth Service' },
    { url: 'http://localhost:8002/health', name: 'Room Service' },
    { url: 'http://localhost:8003/health', name: 'Booking Service' },
    { url: 'http://localhost:8004/health', name: 'Weather Service' },
    { url: 'http://localhost:8005/health', name: 'Notification Service' }
  ];
  
  let serviceNum = 2;
  for (const service of services) {
    process.stdout.write(`${serviceNum}. ${service.name}... `);
    try {
      await axios.get(service.url);
      console.log('✓'.green);
      passed++;
    } catch (error) {
      console.log('✗'.red);
      failed++;
    }
    serviceNum++;
  }
  
  // Test 3: Register & Login
  process.stdout.write(`${serviceNum}. User Registration... `);
  let userToken = '';
  let userId = '';
  try {
    const registerResponse = await axios.post(
      `${API_GATEWAY_URL}/auth/register`,
      {
        email: `quicktest-${Date.now()}@example.com`,
        password: 'testpass123',
        name: 'Quick Test User',
        role: 'user'
      },
      {
        timeout: 30000 // 30 second timeout for registration (bcrypt takes time)
      }
    );
    
    if (registerResponse.data.data && registerResponse.data.data.token) {
      userToken = registerResponse.data.data.token;
      userId = registerResponse.data.data.user.id;
      console.log('✓'.green);
      passed++;
    } else {
      console.log('✗'.red);
      failed++;
    }
  } catch (error) {
    console.log(`✗ (${error.message})`.red);
    failed++;
  }
  serviceNum++;
  
  // Test 4: Get Locations
  process.stdout.write(`${serviceNum}. Get Locations... `);
  let locationId = '';
  try {
    const locations = await axios.get(`${API_GATEWAY_URL}/locations`);
    if (locations.data.data && Array.isArray(locations.data.data)) {
      if (locations.data.data.length > 0) {
        locationId = locations.data.data[0]._id;
        console.log(`✓ (${locations.data.data.length} found)`.green);
      } else {
        console.log('⚠ (No data - run: cd scripts && npm run seed)'.yellow);
      }
      passed++;
    } else {
      console.log('✗'.red);
      failed++;
    }
  } catch (error) {
    console.log('✗'.red);
    failed++;
  }
  serviceNum++;
  
  // Test 5: Get Rooms
  process.stdout.write(`${serviceNum}. Get Rooms... `);
  let roomId = '';
  try {
    const rooms = await axios.get(`${API_GATEWAY_URL}/rooms`);
    if (rooms.data.data && Array.isArray(rooms.data.data)) {
      if (rooms.data.data.length > 0) {
        roomId = rooms.data.data[0]._id;
        locationId = rooms.data.data[0].locationId._id || rooms.data.data[0].locationId;
        console.log(`✓ (${rooms.data.data.length} found)`.green);
      } else {
        console.log('⚠ (No data - run: cd scripts && npm run seed)'.yellow);
      }
      passed++;
    } else {
      console.log('✗'.red);
      failed++;
    }
  } catch (error) {
    console.log('✗'.red);
    failed++;
  }
  serviceNum++;
  
  // Test 6: Weather Forecast
  if (locationId) {
    process.stdout.write(`${serviceNum}. Weather Forecast... `);
    try {
      const date = new Date();
      date.setDate(date.getDate() + 30);
      const dateStr = date.toISOString().split('T')[0];
      
      const weather = await axios.get(`${API_GATEWAY_URL}/weather/forecast/${locationId}/${dateStr}`);
      if (weather.data.data && typeof weather.data.data.temperature === 'number') {
        console.log(`✓ (${weather.data.data.temperature}°C)`.green);
        passed++;
      } else {
        console.log('✗'.red);
        failed++;
      }
    } catch (error) {
      console.log('✗'.red);
      failed++;
    }
    serviceNum++;
  }
  
  // Test 7: Create Booking
  if (roomId && userToken) {
    process.stdout.write(`${serviceNum}. Create Booking... `);
    try {
      const date = new Date();
      date.setDate(date.getDate() + 60);
      const dateStr = date.toISOString().split('T')[0];
      
      const booking = await axios.post(
        `${API_GATEWAY_URL}/bookings`,
        {
          roomId: roomId,
          date: dateStr
        },
        {
          headers: {
            Authorization: `Bearer ${userToken}`
          }
        }
      );
      
      if (booking.data.data && booking.data.data.booking && booking.data.data.booking._id) {
        const price = booking.data.data.priceBreakdown?.adjustedPrice;
        console.log(`✓ ($${price})`.green);
        passed++;
      } else {
        console.log('✗'.red);
        failed++;
      }
    } catch (error) {
      if (error.response?.data?.error?.includes('already booked')) {
        console.log('⚠ (Room already booked)'.yellow);
        passed++;
      } else {
        console.log('✗'.red);
        failed++;
      }
    }
    serviceNum++;
  }
  
  // Test 8: Get User Bookings
  if (userId && userToken) {
    process.stdout.write(`${serviceNum}. Get User Bookings... `);
    try {
      const bookings = await axios.get(
        `${API_GATEWAY_URL}/bookings/user/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${userToken}`
          }
        }
      );
      
      if (bookings.data.data && Array.isArray(bookings.data.data)) {
        console.log(`✓ (${bookings.data.data.length} found)`.green);
        passed++;
      } else {
        console.log('✗'.red);
        failed++;
      }
    } catch (error) {
      console.log('✗'.red);
      failed++;
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60).cyan);
  console.log(`Results: ${passed} passed, ${failed} failed`.cyan);
  
  if (failed === 0) {
    console.log('✅ All tests passed!\n'.green.bold);
    process.exit(0);
  } else {
    console.log(`❌ ${failed} test(s) failed\n`.red.bold);
    process.exit(1);
  }
}

quickTest().catch(error => {
  console.error('Error:'.red, error.message);
  process.exit(1);
});

