const axios = require('axios');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:8001';

/**
 * Verify JWT token with Auth Service
 */
const verifyToken = async (token) => {
  try {
    const response = await axios.get(`${AUTH_SERVICE_URL}/verify`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.data.success) {
      return response.data.data.user;
    }
    
    throw new Error('Token verification failed');
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Authentication failed');
  }
};

module.exports = {
  verifyToken
};

