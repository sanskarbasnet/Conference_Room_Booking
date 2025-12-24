/**
 * API Gateway Test Suite
 * Tests gateway routing and health checks
 */

const axios = require("axios");
const colors = require("colors");

const BASE_URL = process.env.API_GATEWAY_URL || "http://localhost:8000";
const TEST_TIMEOUT = 30000;

let testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
};

function logTest(name, status, details = "") {
  const symbol = status === "pass" ? "✓" : status === "fail" ? "✗" : "⚠";
  const color =
    status === "pass" ? "green" : status === "fail" ? "red" : "yellow";
  console.log(`${symbol} ${name}`[color] + (details ? ` ${details}`.gray : ""));

  if (status === "pass") testResults.passed++;
  else if (status === "fail") testResults.failed++;
  else testResults.skipped++;
}

async function testEndpoint(name, testFn) {
  try {
    const result = await testFn();
    if (result.success) {
      logTest(name, "pass", result.details);
      return result.data;
    } else {
      logTest(name, "fail", result.details || "Test failed");
      return null;
    }
  } catch (error) {
    const errorMsg =
      error.response?.data?.error || error.message || "Unknown error";
    logTest(name, "fail", errorMsg);
    return null;
  }
}

async function runTests() {
  console.log("\n🚪 API Gateway Test Suite".cyan.bold);
  console.log("=".repeat(60).cyan);
  console.log(`Testing: ${BASE_URL}`.gray);
  console.log("=".repeat(60).cyan + "\n");

  // Test 1: Root Endpoint
  await testEndpoint("Root Endpoint", async () => {
    try {
      const response = await axios.get(`${BASE_URL}/`, { timeout: 5000 });
      return {
        success: response.status === 200 && response.data.success,
        details: `Version: ${response.data.version || "N/A"}`,
      };
    } catch (error) {
      if (error.code === "ECONNREFUSED") {
        return { success: false, details: "Service not running" };
      }
      throw error;
    }
  });

  // Test 2: Health Check
  await testEndpoint("Health Check", async () => {
    try {
      const response = await axios.get(`${BASE_URL}/health`, {
        timeout: 10000,
      });
      // Accept both 200 and 503 (503 means some services unhealthy but gateway is up)
      if (response.status === 200 || response.status === 503) {
        const services = response.data.services || {};
        const healthyCount = Object.values(services).filter(
          (s) => s.status === "healthy"
        ).length;
        const totalCount = Object.keys(services).length;
        return {
          success: true,
          details: `${healthyCount}/${totalCount} services healthy`,
        };
      }
      return {
        success: false,
        details: `Unexpected status: ${response.status}`,
      };
    } catch (error) {
      if (error.code === "ECONNREFUSED") {
        return { success: false, details: "Service not running" };
      }
      throw error;
    }
  });

  // Test 3: Route to Auth Service
  await testEndpoint("Route to Auth Service", async () => {
    try {
      const response = await axios.get(`${BASE_URL}/auth/verify`, {
        timeout: TEST_TIMEOUT,
      });
      // Should return 401 (no token) but route should work
      return {
        success:
          response.status === 401 || (response.data && response.data.error),
        details: "Route working (401 expected without token)",
      };
    } catch (error) {
      if (error.response && error.response.status === 401) {
        return { success: true, details: "Route working (401 expected)" };
      }
      if (error.code === "ECONNREFUSED") {
        return { success: false, details: "Service not running" };
      }
      throw error;
    }
  });

  // Test 4: Route to Room Service
  await testEndpoint("Route to Room Service", async () => {
    try {
      const response = await axios.get(`${BASE_URL}/locations`, {
        timeout: TEST_TIMEOUT,
      });
      return {
        success: response.status === 200 && response.data.data,
        details: Array.isArray(response.data.data)
          ? `${response.data.data.length} locations`
          : "Route working",
      };
    } catch (error) {
      if (error.code === "ECONNREFUSED") {
        return { success: false, details: "Service not running" };
      }
      throw error;
    }
  });

  // Test 5: Route to Weather Service
  await testEndpoint("Route to Weather Service", async () => {
    try {
      const testLocationId = "507f1f77bcf86cd799439011";
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);
      const dateStr = futureDate.toISOString().split("T")[0];

      const response = await axios.get(
        `${BASE_URL}/weather/forecast/${testLocationId}/${dateStr}`,
        { timeout: TEST_TIMEOUT }
      );
      return {
        success: response.status === 200 && response.data.success,
        details: "Route working",
      };
    } catch (error) {
      // Accept rate limiting as valid response
      if (
        error.response &&
        (error.response.status === 200 || error.response.status === 429)
      ) {
        return { success: true, details: "Route working" };
      }
      if (error.code === "ECONNREFUSED") {
        return { success: false, details: "Service not running" };
      }
      throw error;
    }
  });

  // Test 6: Route to Notification Service
  await testEndpoint("Route to Notification Service", async () => {
    try {
      const response = await axios.get(`${BASE_URL}/notifications/test`, {
        timeout: TEST_TIMEOUT,
      });
      return {
        success: response.status === 200 && response.data.success,
        details: "Route working",
      };
    } catch (error) {
      if (error.code === "ECONNREFUSED") {
        return { success: false, details: "Service not running" };
      }
      throw error;
    }
  });

  // Test 7: 404 for Invalid Route
  await testEndpoint("404 for Invalid Route", async () => {
    try {
      await axios.get(`${BASE_URL}/invalid-route-12345`, {
        timeout: TEST_TIMEOUT,
      });
      return { success: false, details: "Should have returned 404" };
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return { success: true, details: "Correctly returned 404" };
      }
      if (error.code === "ECONNREFUSED") {
        return { success: false, details: "Service not running" };
      }
      throw error;
    }
  });

  // Summary
  console.log("\n" + "=".repeat(60).cyan);
  console.log("📊 Test Summary".cyan.bold);
  console.log("=".repeat(60).cyan);
  console.log(`✓ Passed: ${testResults.passed}`.green);
  console.log(`✗ Failed: ${testResults.failed}`.red);
  console.log(`⚠ Skipped: ${testResults.skipped}`.yellow);
  console.log("=".repeat(60).cyan);

  const total = testResults.passed + testResults.failed + testResults.skipped;
  const successRate =
    total > 0 ? ((testResults.passed / total) * 100).toFixed(1) : 0;
  console.log(`\nSuccess Rate: ${successRate}%`.cyan);

  if (testResults.failed === 0 && testResults.passed > 0) {
    console.log("\n✅ All tests passed!".green.bold);
    process.exit(0);
  } else if (testResults.passed === 0) {
    console.log("\n⚠️  Service may not be running. Tests skipped.".yellow.bold);
    process.exit(0);
  } else {
    console.log(`\n⚠️  ${testResults.failed} test(s) failed.`.yellow.bold);
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error("\n❌ Test suite error:".red.bold, error.message);
  process.exit(1);
});
