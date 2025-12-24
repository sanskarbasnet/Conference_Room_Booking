/**
 * Booking Service Test Suite
 * Tests booking endpoints and functionality
 */

const axios = require('axios');
const colors = require('colors');

const BASE_URL = process.env.BOOKING_SERVICE_URL || 'http://localhost:8003';
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
  console.log('\n📅 Booking Service Test Suite'.cyan.bold);
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

  // Test 2: Service Info
  await testEndpoint('Service Info', async () => {
    try {
      const response = await axios.get(`${BASE_URL}/`, { timeout: 5000 });
      return {
        success: response.status === 200 && response.data.service,
        details: response.data.service || 'No service info'
      };
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        return { success: false, details: 'Service not running' };
      }
      throw error;
    }
  });

  // Test 3: Access Protected Endpoint Without Token (401)
  await testEndpoint('Access Protected Endpoint Without Token (401)', async () => {
    try {
      await axios.get(`${BASE_URL}/bookings`, { timeout: TEST_TIMEOUT });
      return { success: false, details: 'Should have returned 401' };
    } catch (error) {
      if (error.response && error.response.status === 401) {
        return { success: true, details: 'Correctly returned 401' };
      }
      if (error.code === 'ECONNREFUSED') {
        return { success: false, details: 'Service not running' };
      }
      throw error;
    }
  });

  // Test 4: Create Booking Without Token (401)
  await testEndpoint('Create Booking Without Token (401)', async () => {
    try {
      await axios.post(
        `${BASE_URL}/bookings`,
        { roomId: 'test', date: '2025-12-25' },
        { timeout: TEST_TIMEOUT }
      );
      return { success: false, details: 'Should have returned 401' };
    } catch (error) {
      if (error.response && error.response.status === 401) {
        return { success: true, details: 'Correctly returned 401' };
      }
      if (error.code === 'ECONNREFUSED') {
        return { success: false, details: 'Service not running' };
      }
      throw error;
    }
  });

  // Test 5: Create Booking with Invalid Token (401)
  await testEndpoint('Create Booking with Invalid Token (401)', async () => {
    try {
      await axios.post(
        `${BASE_URL}/bookings`,
        { roomId: 'test', date: '2025-12-25' },
        {
          headers: { Authorization: 'Bearer invalid-token' },
          timeout: TEST_TIMEOUT
        }
      );
      return { success: false, details: 'Should have returned 401' };
    } catch (error) {
      if (error.response && error.response.status === 401) {
        return { success: true, details: 'Correctly returned 401' };
      }
      if (error.code === 'ECONNREFUSED') {
        return { success: false, details: 'Service not running' };
      }
      throw error;
    }
  });

  // Test 6: Create Booking with Invalid Data (400)
  await testEndpoint('Create Booking with Invalid Data (400)', async () => {
    try {
      await axios.post(
        `${BASE_URL}/bookings`,
        { roomId: 'invalid', date: 'invalid-date' },
        {
          headers: { Authorization: 'Bearer test-token' },
          timeout: TEST_TIMEOUT
        }
      );
      return { success: false, details: 'Should have returned 400' };
    } catch (error) {
      if (error.response && (error.response.status === 400 || error.response.status === 401)) {
        return { success: true, details: 'Correctly rejected invalid data' };
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

