const Location = require('../models/Location');
const Room = require('../models/Room');
const { validationResult } = require('express-validator');

/**
 * GET /locations
 * Get all locations
 */
exports.getAllLocations = async (req, res) => {
  try {
    const { city, country, active } = req.query;

    // Build query
    const query = {};
    if (city) query.city = new RegExp(city, 'i');
    if (country) query.country = new RegExp(country, 'i');
    if (active !== undefined) query.isActive = active === 'true';

    const locations = await Location.find(query).sort({ name: 1 });

    // Get room counts for each location
    const locationsWithRoomCount = await Promise.all(
      locations.map(async (location) => {
        const roomCount = await Room.countDocuments({ 
          locationId: location._id,
          isActive: true 
        });
        
        return {
          ...location.toJSON(),
          roomCount
        };
      })
    );

    res.status(200).json({
      success: true,
      count: locationsWithRoomCount.length,
      data: locationsWithRoomCount
    });

  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch locations',
      message: error.message
    });
  }
};

/**
 * GET /locations/:id
 * Get single location by ID
 */
exports.getLocationById = async (req, res) => {
  try {
    const { id } = req.params;

    const location = await Location.findById(id);

    if (!location) {
      return res.status(404).json({
        success: false,
        error: 'Location not found'
      });
    }

    // Get rooms for this location
    const rooms = await Room.find({ 
      locationId: id,
      isActive: true 
    });

    res.status(200).json({
      success: true,
      data: {
        location: location.toJSON(),
        rooms: rooms.map(room => room.toJSON()),
        roomCount: rooms.length
      }
    });

  } catch (error) {
    console.error('Get location error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid location ID format'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch location',
      message: error.message
    });
  }
};

/**
 * POST /locations
 * Create new location (Admin only)
 */
exports.createLocation = async (req, res) => {
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

    const { name, address, city, country, description } = req.body;

    // Check if location with same name and city exists
    const existingLocation = await Location.findOne({ 
      name: name.trim(), 
      city: city.trim() 
    });

    if (existingLocation) {
      return res.status(400).json({
        success: false,
        error: 'Location with this name already exists in this city'
      });
    }

    // Create location
    const location = new Location({
      name: name.trim(),
      address: address.trim(),
      city: city.trim(),
      country: country.trim(),
      description: description ? description.trim() : undefined
    });

    await location.save();

    res.status(201).json({
      success: true,
      message: 'Location created successfully',
      data: location.toJSON()
    });

  } catch (error) {
    console.error('Create location error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create location',
      message: error.message
    });
  }
};

/**
 * PUT /locations/:id
 * Update location (Admin only)
 */
exports.updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, city, country, description, isActive } = req.body;

    const location = await Location.findById(id);

    if (!location) {
      return res.status(404).json({
        success: false,
        error: 'Location not found'
      });
    }

    // Update fields
    if (name) location.name = name.trim();
    if (address) location.address = address.trim();
    if (city) location.city = city.trim();
    if (country) location.country = country.trim();
    if (description !== undefined) location.description = description.trim();
    if (isActive !== undefined) location.isActive = isActive;

    await location.save();

    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      data: location.toJSON()
    });

  } catch (error) {
    console.error('Update location error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid location ID format'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update location',
      message: error.message
    });
  }
};

/**
 * DELETE /locations/:id
 * Delete location (Admin only)
 */
exports.deleteLocation = async (req, res) => {
  try {
    const { id } = req.params;

    const location = await Location.findById(id);

    if (!location) {
      return res.status(404).json({
        success: false,
        error: 'Location not found'
      });
    }

    // Check if location has rooms
    const roomCount = await Room.countDocuments({ locationId: id });

    if (roomCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete location with existing rooms',
        message: `This location has ${roomCount} room(s). Delete or reassign rooms first.`
      });
    }

    await Location.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Location deleted successfully'
    });

  } catch (error) {
    console.error('Delete location error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid location ID format'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to delete location',
      message: error.message
    });
  }
};

