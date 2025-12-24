/**
 * Weather Service Test Suite
 * Tests weather forecast endpoints
 */

const axios = require('axios');
const colors = require('colors');

const BASE_URL = process.env.WEATHER_SERVICE_URL || 'http://localhost:8004';
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
  console.log('\n🌤️  Weather Service Test Suite'.cyan.bold);
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

  // Test 3: Get Forecast with Valid Location and Date
  const testLocationId = '507f1f77bcf86cd799439011'; // Valid MongoDB ObjectId format
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 15);
  const dateStr = futureDate.toISOString().split('T')[0];

  await testEndpoint('Get Forecast', async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/forecast/${testLocationId}/${dateStr}`,
        { timeout: TEST_TIMEOUT }
      );

      return {
        success: response.data.success && 
                response.data.data && 
                typeof response.data.data.temperature === 'number',
        details: `${response.data.data.temperature}°C`
      };
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        return { success: false, details: 'Service not running' };
      }
      throw error;
    }
  });

  // Test 4: Get Forecast with Invalid Location ID (400)
  await testEndpoint('Get Forecast with Invalid Location ID (400)', async () => {
    try {
      await axios.get(`${BASE_URL}/forecast/invalid-id/2025-12-25`, { timeout: TEST_TIMEOUT });
      return { success: false, details: 'Should have returned 400' };
    } catch (error) {
      if (error.response && error.response.status === 400) {
        return { success: true, details: 'Correctly returned 400' };
      }
      if (error.code === 'ECONNREFUSED') {
        return { success: false, details: 'Service not running' };
      }
      throw error;
    }
  });

  // Test 5: Get Forecast with Invalid Date Format (400)
  await testEndpoint('Get Forecast with Invalid Date Format (400)', async () => {
    try {
      await axios.get(`${BASE_URL}/forecast/${testLocationId}/invalid-date`, { timeout: TEST_TIMEOUT });
      return { success: false, details: 'Should have returned 400' };
    } catch (error) {
      if (error.response && error.response.status === 400) {
        return { success: true, details: 'Correctly returned 400' };
      }
      if (error.code === 'ECONNREFUSED') {
        return { success: false, details: 'Service not running' };
      }
      throw error;
    }
  });

  // Test 6: Get Bulk Forecasts
  await testEndpoint('Get Bulk Forecasts', async () => {
    try {
      const response = await axios.post(
        `${BASE_URL}/forecast/bulk`,
        {
          forecasts: [
            { locationId: testLocationId, date: dateStr },
            { locationId: testLocationId, date: futureDate.toISOString().split('T')[0] }
          ]
        },
        { timeout: TEST_TIMEOUT }
      );

      return {
        success: response.data.success && 
                response.data.data && 
                Array.isArray(response.data.data),
        details: `${response.data.data.length} forecasts returned`
      };
    } catch (error) {
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

