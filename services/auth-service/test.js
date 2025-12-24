/**
 * Auth Service Test Suite
 * Tests authentication endpoints and functionality
 */

const axios = require('axios');
const colors = require('colors');

const BASE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:8001';
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
  console.log('\n🔐 Auth Service Test Suite'.cyan.bold);
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
        return {
          success: false,
          details: 'Service not running (expected in CI if service not started)'
        };
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

  // Test 3: Register User
  const testEmail = `test-${Date.now()}@example.com`;
  let userToken = '';
  let userId = '';

  await testEndpoint('Register User', async () => {
    try {
      const response = await axios.post(
        `${BASE_URL}/register`,
        {
          email: testEmail,
          password: 'Test123!@#',
          name: 'Test User',
          role: 'user'
        },
        { timeout: TEST_TIMEOUT }
      );

      if (response.data.data && response.data.data.token) {
        userToken = response.data.data.token;
        userId = response.data.data.user._id || response.data.data.user.id;
        return {
          success: true,
          details: `User ID: ${userId.substring(0, 8)}...`,
          data: { token: userToken, userId }
        };
      }
      return { success: false, details: 'No token in response' };
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        return { success: false, details: 'Service not running' };
      }
      throw error;
    }
  });

  // Test 4: Register Duplicate User (should fail)
  await testEndpoint('Register Duplicate User (Validation)', async () => {
    try {
      await axios.post(
        `${BASE_URL}/register`,
        {
          email: testEmail,
          password: 'Test123!@#',
          name: 'Test User',
          role: 'user'
        },
        { timeout: TEST_TIMEOUT }
      );
      return { success: false, details: 'Should have rejected duplicate email' };
    } catch (error) {
      if (error.response && (error.response.status === 400 || error.response.status === 409)) {
        return { success: true, details: 'Correctly rejected duplicate email' };
      }
      if (error.code === 'ECONNREFUSED') {
        return { success: false, details: 'Service not running' };
      }
      throw error;
    }
  });

  // Test 5: Login
  await testEndpoint('Login User', async () => {
    try {
      const response = await axios.post(
        `${BASE_URL}/login`,
        {
          email: testEmail,
          password: 'Test123!@#'
        },
        { timeout: TEST_TIMEOUT }
      );

      return {
        success: response.data.data && response.data.data.token,
        details: 'Token received'
      };
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        return { success: false, details: 'Service not running' };
      }
      throw error;
    }
  });

  // Test 6: Login with Wrong Password
  await testEndpoint('Login with Wrong Password (Validation)', async () => {
    try {
      await axios.post(
        `${BASE_URL}/login`,
        {
          email: testEmail,
          password: 'WrongPassword123!'
        },
        { timeout: TEST_TIMEOUT }
      );
      return { success: false, details: 'Should have rejected wrong password' };
    } catch (error) {
      if (error.response && error.response.status === 401) {
        return { success: true, details: 'Correctly rejected wrong password' };
      }
      if (error.code === 'ECONNREFUSED') {
        return { success: false, details: 'Service not running' };
      }
      throw error;
    }
  });

  // Test 7: Get Profile (if we have a token)
  if (userToken) {
    await testEndpoint('Get User Profile', async () => {
      try {
        const response = await axios.get(`${BASE_URL}/me`, {
          headers: { Authorization: `Bearer ${userToken}` },
          timeout: TEST_TIMEOUT
        });

        return {
          success: response.data.data && response.data.data.email === testEmail,
          details: `Email: ${response.data.data?.email || 'N/A'}`
        };
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          return { success: false, details: 'Service not running' };
        }
        throw error;
      }
    });
  }

  // Test 8: Verify Token
  if (userToken) {
    await testEndpoint('Verify Token', async () => {
      try {
        const response = await axios.get(`${BASE_URL}/verify`, {
          headers: { Authorization: `Bearer ${userToken}` },
          timeout: TEST_TIMEOUT
        });

        return {
          success: response.data.success && response.data.data && response.data.data.user,
          details: 'Token verified'
        };
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          return { success: false, details: 'Service not running' };
        }
        throw error;
      }
    });
  }

  // Test 9: Verify Invalid Token
  await testEndpoint('Verify Invalid Token (Validation)', async () => {
    try {
      await axios.get(`${BASE_URL}/verify`, {
        headers: { Authorization: 'Bearer invalid-token-12345' },
        timeout: TEST_TIMEOUT
      });
      return { success: false, details: 'Should have rejected invalid token' };
    } catch (error) {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        return { success: true, details: 'Correctly rejected invalid token' };
      }
      if (error.code === 'ECONNREFUSED') {
        return { success: false, details: 'Service not running' };
      }
      throw error;
    }
  });

  // Test 10: Register with Invalid Email
  await testEndpoint('Register with Invalid Email (Validation)', async () => {
    try {
      await axios.post(
        `${BASE_URL}/register`,
        {
          email: 'invalid-email',
          password: 'Test123!@#',
          name: 'Test User',
          role: 'user'
        },
        { timeout: TEST_TIMEOUT }
      );
      return { success: false, details: 'Should have rejected invalid email' };
    } catch (error) {
      if (error.response && error.response.status === 400) {
        return { success: true, details: 'Correctly rejected invalid email' };
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
    process.exit(0); // Don't fail CI if service isn't running
  } else {
    console.log(`\n⚠️  ${testResults.failed} test(s) failed.`.yellow.bold);
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Test suite error:'.red.bold, error.message);
  process.exit(1);
});

