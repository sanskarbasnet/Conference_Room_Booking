const axios = require('axios');

const ROOM_SERVICE_URL = process.env.ROOM_SERVICE_URL || 'http://localhost:8002';

/**
 * Get room details by ID
 */
const getRoomById = async (roomId) => {
  try {
    const response = await axios.get(`${ROOM_SERVICE_URL}/rooms/${roomId}`);
    
    if (response.data.success) {
      return response.data.data;
    }
    
    throw new Error('Room not found');
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error('Room not found');
    }
    throw new Error(error.response?.data?.error || 'Failed to fetch room details');
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

