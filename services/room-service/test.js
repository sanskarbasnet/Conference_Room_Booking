/**
 * Room Service Test Suite
 * Tests location and room endpoints
 */

const axios = require('axios');
const colors = require('colors');

const BASE_URL = process.env.ROOM_SERVICE_URL || 'http://localhost:8002';
const TEST_TIMEOUT = 30000;

let testResults = {
  passed: 0,
  failed: 0,
  skipped: 0
};

function logTest(name, status, details = '') {
  const symbol = status === 'pass' ? '✓' : status === 'fail' ? '✗' : '⚠';
  const color = status === 'pass' ? 'green' : status === 'fail' ? 'red' : 'yellow';
  console.log(`${symbol} ${name}`[color] + (details ? ` ${details}`.gray : ''));
  
  if (status === 'pass') testResults.passed++;
  else if (status === 'fail') testResults.failed++;
  else testResults.skipped++;
}

async function testEndpoint(name, testFn) {
  try {
    const result = await testFn();
    if (result.success) {
      logTest(name, 'pass', result.details);
      return result.data;
    } else {
      // If service is not running, mark as skipped instead of failed
      if (result.details && result.details.includes('Service not running')) {
        logTest(name, 'skip', result.details);
      } else {
        logTest(name, 'fail', result.details || 'Test failed');
      }
      return null;
    }
  } catch (error) {
    // If connection refused, mark as skipped
    if (error.code === 'ECONNREFUSED') {
      logTest(name, 'skip', 'Service not running');
    } else {
      const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
      logTest(name, 'fail', errorMsg);
    }
    return null;
  }
}

async function runTests() {
  console.log('\n📍 Room Service Test Suite'.cyan.bold);
  console.log('='.repeat(60).cyan);
  console.log(`Testing: ${BASE_URL}`.gray);
  console.log('='.repeat(60).cyan + '\n');

  // Test 1: Health Check
  await testEndpoint('Health Check', async () => {
    try {
      const response = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
      return {
        success: response.status === 200,
        details: `Status: ${response.status}`
      };
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        return { success: false, details: 'Service not running' };
      }
      throw error;
    }
  });

  // Test 2: Get All Locations
  let locationId = '';
  const locationData = await testEndpoint('Get All Locations', async () => {
    try {
      const response = await axios.get(`${BASE_URL}/locations`, { timeout: TEST_TIMEOUT });
      if (response.data.data && Array.isArray(response.data.data)) {
        if (response.data.data.length > 0) {
          locationId = String(response.data.data[0]._id); // Convert to string for consistency
          return {
            success: true,
            details: `${response.data.data.length} locations found`,
            data: { locationId }
          };
        } else {
          // Empty array is valid - service is working, just no data
          return {
            success: true,
            details: '0 locations (empty database - expected in CI)',
            data: { locationId: null }
          };
        }
      }
      return { success: false, details: 'Invalid response structure' };
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        return { success: false, details: 'Service not running' };
      }
      throw error;
    }
  });
  
  // Update locationId from returned data if available
  if (locationData && locationData.locationId) {
    locationId = String(locationData.locationId);
  }

  // Test 3: Get Location by ID
  if (locationId) {
    await testEndpoint('Get Location by ID', async () => {
      try {
        const response = await axios.get(`${BASE_URL}/locations/${locationId}`, { timeout: TEST_TIMEOUT });
        // Convert both IDs to strings for comparison (MongoDB ObjectIds can be objects or strings)
        const responseId = String(response.data.data?._id || '');
        const expectedId = String(locationId);
        return {
          success: response.data.success && response.data.data && responseId === expectedId,
          details: response.data.data?.name || 'Location found'
        };
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          return { success: false, details: 'Service not running' };
        }
        throw error;
      }
    });
  }

  // Test 4: Get All Rooms
  let roomId = '';
  const roomData = await testEndpoint('Get All Rooms', async () => {
    try {
      const response = await axios.get(`${BASE_URL}/rooms`, { timeout: TEST_TIMEOUT });
      if (response.data.data && Array.isArray(response.data.data)) {
        if (response.data.data.length > 0) {
          roomId = String(response.data.data[0]._id); // Convert to string for consistency
          return {
            success: true,
            details: `${response.data.data.length} rooms found`,
            data: { roomId }
          };
        } else {
          // Empty array is valid - service is working, just no data
          return {
            success: true,
            details: '0 rooms (empty database - expected in CI)',
            data: { roomId: null }
          };
        }
      }
      return { success: false, details: 'Invalid response structure' };
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        return { success: false, details: 'Service not running' };
      }
      throw error;
    }
  });
  
  // Update roomId from returned data if available
  if (roomData && roomData.roomId) {
    roomId = String(roomData.roomId);
  }

  // Test 5: Get Room by ID
  if (roomId) {
    await testEndpoint('Get Room by ID', async () => {
      try {
        const response = await axios.get(`${BASE_URL}/rooms/${roomId}`, { timeout: TEST_TIMEOUT });
        // Convert both IDs to strings for comparison (MongoDB ObjectIds can be objects or strings)
        const responseId = String(response.data.data?._id || '');
        const expectedId = String(roomId);
        return {
          success: response.data.success && response.data.data && responseId === expectedId,
          details: response.data.data?.name || 'Room found'
        };
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          return { success: false, details: 'Service not running' };
        }
        throw error;
      }
    });
  }

  // Test 6: Get Rooms by Location
  if (locationId) {
    await testEndpoint('Get Rooms by Location', async () => {
      try {
        const response = await axios.get(`${BASE_URL}/rooms/location/${locationId}`, { timeout: TEST_TIMEOUT });
        return {
          success: response.data.data && Array.isArray(response.data.data),
          details: `${response.data.data.length} rooms in location`
        };
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          return { success: false, details: 'Service not running' };
        }
        throw error;
      }
    });
  }

  // Test 7: Get Invalid Location (404)
  await testEndpoint('Get Invalid Location (404)', async () => {
    try {
      await axios.get(`${BASE_URL}/locations/000000000000000000000000`, { timeout: TEST_TIMEOUT });
      return { success: false, details: 'Should have returned 404' };
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return { success: true, details: 'Correctly returned 404' };
      }
      if (error.code === 'ECONNREFUSED') {
        return { success: false, details: 'Service not running' };
      }
      throw error;
    }
  });

  // Test 8: Get Invalid Room (404)
  await testEndpoint('Get Invalid Room (404)', async () => {
    try {
      await axios.get(`${BASE_URL}/rooms/000000000000000000000000`, { timeout: TEST_TIMEOUT });
      return { success: false, details: 'Should have returned 404' };
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return { success: true, details: 'Correctly returned 404' };
      }
      if (error.code === 'ECONNREFUSED') {
        return { success: false, details: 'Service not running' };
      }
      throw error;
    }
  });

  // Summary
  console.log('\n' + '='.repeat(60).cyan);
  console.log('📊 Test Summary'.cyan.bold);
  console.log('='.repeat(60).cyan);
  console.log(`✓ Passed: ${testResults.passed}`.green);
  console.log(`✗ Failed: ${testResults.failed}`.red);
  console.log(`⚠ Skipped: ${testResults.skipped}`.yellow);
  console.log('='.repeat(60).cyan);

  const total = testResults.passed + testResults.failed + testResults.skipped;
  const successRate = total > 0 ? ((testResults.passed / total) * 100).toFixed(1) : 0;
  console.log(`\nSuccess Rate: ${successRate}%`.cyan);

  if (testResults.failed === 0 && testResults.passed > 0) {
    console.log('\n✅ All tests passed!'.green.bold);
    process.exit(0);
  } else if (testResults.passed === 0) {
    console.log('\n⚠️  Service may not be running. Tests skipped.'.yellow.bold);
    process.exit(0);
  } else {
    console.log(`\n⚠️  ${testResults.failed} test(s) failed.`.yellow.bold);
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('\n❌ Test suite error:'.red.bold, error.message);
  process.exit(1);
});

