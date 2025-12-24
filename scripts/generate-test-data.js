// Generate Test Data - Create additional bookings for testing

const axios = require('axios');
const colors = require('colors');

const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:8000';
const NUM_BOOKINGS = parseInt(process.argv[2]) || 10;

// Configure axios defaults with timeout
axios.defaults.timeout = 30000; // 30 seconds timeout

async function generateTestData() {
  console.log('🎲 Test Data Generator'.cyan.bold);
  console.log(`Creating ${NUM_BOOKINGS} test bookings...\n`.cyan);
  
  // Step 1: Register and login a test user
  console.log('1. Creating test user...'.yellow);
  const userEmail = `testdata-${Date.now()}@example.com`;
  let userToken = '';
  
  try {
    const registerResponse = await axios.post(`${API_GATEWAY_URL}/auth/register`, {
      email: userEmail,
      password: 'testpass123',
      name: 'Test Data Generator',
      role: 'user'
    });
    
    userToken = registerResponse.data.data.token;
    console.log(`✓ User created: ${userEmail}`.green);
  } catch (error) {
    console.error('✗ Failed to create user'.red, error.response?.data?.error || error.message);
    process.exit(1);
  }
  
  // Step 2: Get all rooms
  console.log('\n2. Fetching available rooms...'.yellow);
  let rooms = [];
  
  try {
    const roomsResponse = await axios.get(`${API_GATEWAY_URL}/rooms`);
    rooms = roomsResponse.data.data;
    console.log(`✓ Found ${rooms.length} rooms`.green);
    
    if (rooms.length === 0) {
      console.log('\n⚠ No rooms available. Please run: cd scripts && npm run seed\n'.yellow);
      process.exit(1);
    }
  } catch (error) {
    console.error('✗ Failed to fetch rooms'.red, error.response?.data?.error || error.message);
    process.exit(1);
  }
  
  // Step 3: Create bookings
  console.log(`\n3. Creating ${NUM_BOOKINGS} bookings...`.yellow);
  
  let created = 0;
  let failed = 0;
  
  for (let i = 0; i < NUM_BOOKINGS; i++) {
    // Random room
    const room = rooms[Math.floor(Math.random() * rooms.length)];
    
    // Random date in the future (1-90 days from now)
    const daysAhead = Math.floor(Math.random() * 90) + 1;
    const bookingDate = new Date();
    bookingDate.setDate(bookingDate.getDate() + daysAhead);
    const dateStr = bookingDate.toISOString().split('T')[0];
    
    try {
      const bookingResponse = await axios.post(
        `${API_GATEWAY_URL}/bookings`,
        {
          roomId: room._id,
          date: dateStr
        },
        {
          headers: {
            Authorization: `Bearer ${userToken}`
          }
        }
      );
      
      const price = bookingResponse.data.data.adjustedPrice || bookingResponse.data.data.priceBreakdown?.adjustedPrice;
      console.log(`  ✓ Booking ${i + 1}: ${room.name} on ${dateStr} ($${price})`.green);
      created++;
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      
      if (errorMsg.includes('already booked')) {
        console.log(`  ⚠ Booking ${i + 1}: ${room.name} on ${dateStr} (already booked)`.yellow);
      } else {
        console.log(`  ✗ Booking ${i + 1}: ${errorMsg}`.red);
        failed++;
      }
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60).cyan);
  console.log(`✓ Created: ${created} bookings`.green);
  if (failed > 0) {
    console.log(`✗ Failed: ${failed} bookings`.red);
  }
  console.log('='.repeat(60).cyan);
  console.log(`\nUser email: ${userEmail}`.cyan);
  console.log('Password: testpass123\n'.cyan);
}

generateTestData().catch(error => {
  console.error('Error:'.red, error.message);
  process.exit(1);
});

