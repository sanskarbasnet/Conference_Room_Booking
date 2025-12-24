const Room = require('../models/Room');
const Location = require('../models/Location');
const { validationResult } = require('express-validator');

/**
 * GET /rooms
 * Get all rooms with optional filters
 */
exports.getAllRooms = async (req, res) => {
  try {
    const { locationId, minCapacity, maxCapacity, minPrice, maxPrice, active } = req.query;

    // Build query
    const query = {};
    if (locationId) query.locationId = locationId;
    if (minCapacity) query.capacity = { ...query.capacity, $gte: parseInt(minCapacity) };
    if (maxCapacity) query.capacity = { ...query.capacity, $lte: parseInt(maxCapacity) };
    if (minPrice) query.basePrice = { ...query.basePrice, $gte: parseFloat(minPrice) };
    if (maxPrice) query.basePrice = { ...query.basePrice, $lte: parseFloat(maxPrice) };
    if (active !== undefined) query.isActive = active === 'true';

    const rooms = await Room.find(query)
      .populate('locationId', 'name city country')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms.map(room => room.toJSON())
    });

  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rooms',
      message: error.message
    });
  }
};

/**
 * GET /rooms/:id
 * Get single room by ID
 */
exports.getRoomById = async (req, res) => {
  try {
    const { id } = req.params;

    const room = await Room.findById(id).populate('locationId');

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }

    res.status(200).json({
      success: true,
      data: room.toJSON()
    });

  } catch (error) {
    console.error('Get room error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid room ID format'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch room',
      message: error.message
    });
  }
};

/**
 * POST /rooms
 * Create new room (Admin only)
 */
exports.createRoom = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, locationId, capacity, basePrice, amenities, description, floor } = req.body;

    // Verify location exists
    const location = await Location.findById(locationId);
    if (!location) {
      return res.status(404).json({
        success: false,
        error: 'Location not found'
      });
    }

    if (!location.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Cannot add room to inactive location'
      });
    }

    // Check if room with same name exists in this location
    const existingRoom = await Room.findOne({ 
      name: name.trim(), 
      locationId 
    });

    if (existingRoom) {
      return res.status(400).json({
        success: false,
        error: 'Room with this name already exists in this location'
      });
    }

    // Create room
    const room = new Room({
      name: name.trim(),
      locationId,
      capacity,
      basePrice,
      amenities: amenities || [],
      description: description ? description.trim() : undefined,
      floor
    });

    await room.save();

    // Populate location before sending response
    await room.populate('locationId', 'name city country');

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: room.toJSON()
    });

  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create room',
      message: error.message
    });
  }
};

/**
 * PUT /rooms/:id
 * Update room (Admin only)
 */
exports.updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, capacity, basePrice, amenities, description, floor, isActive } = req.body;

    const room = await Room.findById(id);

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }

    // Update fields
    if (name) room.name = name.trim();
    if (capacity) room.capacity = capacity;
    if (basePrice !== undefined) room.basePrice = basePrice;
    if (amenities) room.amenities = amenities;
    if (description !== undefined) room.description = description.trim();
    if (floor !== undefined) room.floor = floor;
    if (isActive !== undefined) room.isActive = isActive;

    await room.save();
    await room.populate('locationId', 'name city country');

    res.status(200).json({
      success: true,
      message: 'Room updated successfully',
      data: room.toJSON()
    });

  } catch (error) {
    console.error('Update room error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid room ID format'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update room',
      message: error.message
    });
  }
};

/**
 * DELETE /rooms/:id
 * Delete room (Admin only)
 */
exports.deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;

    const room = await Room.findById(id);

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }

    // Note: In production, you might want to check for existing bookings
    // For now, we'll allow deletion

    await Room.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Room deleted successfully'
    });

  } catch (error) {
    console.error('Delete room error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid room ID format'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to delete room',
      message: error.message
    });
  }
};

/**
 * GET /rooms/location/:locationId
 * Get all rooms for a specific location
 */
exports.getRoomsByLocation = async (req, res) => {
  try {
    const { locationId } = req.params;

    // Verify location exists
    const location = await Location.findById(locationId);
    if (!location) {
      return res.status(404).json({
        success: false,
        error: 'Location not found'
      });
    }

    const rooms = await Room.find({ 
      locationId,
      isActive: true 
    }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      location: {
        id: location._id,
        name: location.name,
        city: location.city,
        country: location.country
      },
      count: rooms.length,
      data: rooms.map(room => room.toJSON())
    });

  } catch (error) {
    console.error('Get rooms by location error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid location ID format'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch rooms',
      message: error.message
    });
  }
};

