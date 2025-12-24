const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// Send notification
router.post('/notify', notificationController.sendNotification);

// Test endpoint
router.get('/notifications/test', notificationController.testNotification);

module.exports = router;

