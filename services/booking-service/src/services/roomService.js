const axios = require('axios');

const ROOM_SERVICE_URL = process.env.ROOM_SERVICE_URL || 'http://localhost:8002';

/**
 * Get room details by ID
 */
const getRoomById = async (roomId) => {
  try {
    // Handle both cases: URL with /rooms and without
    // If URL already ends with /rooms, just append /${roomId}
    // Otherwise, append /rooms/${roomId}
    let url;
    if (ROOM_SERVICE_URL.endsWith('/rooms')) {
      url = `${ROOM_SERVICE_URL}/${roomId}`;
    } else {
      url = `${ROOM_SERVICE_URL}/rooms/${roomId}`;
    }
    
    const response = await axios.get(url, {
      timeout: 30000 // 30 second timeout
    });
    
    if (response.data.success) {
      return response.data.data;
    }
    
    throw new Error('Room not found');
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error('Room not found');
    }
    // Log detailed error for debugging
    const url = ROOM_SERVICE_URL.endsWith('/rooms') 
      ? `${ROOM_SERVICE_URL}/${roomId}`
      : `${ROOM_SERVICE_URL}/rooms/${roomId}`;
    console.error('Room Service Error:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data,
      url: url
    });
    throw new Error(error.response?.data?.error || error.message || 'Failed to fetch room details');
  }
};

/**
 * Validate room exists and is active
 */
const validateRoom = async (roomId) => {
  const room = await getRoomById(roomId);
  
  if (!room.isActive) {
    throw new Error('Room is not available for booking');
  }
  
  return room;
};

module.exports = {
  getRoomById,
  validateRoom
};

