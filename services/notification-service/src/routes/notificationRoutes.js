const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// Send notification (handle both /notify and /notification/notify)
router.post('/notify', notificationController.sendNotification);
router.post('/notification/notify', notificationController.sendNotification);

// Test endpoint (handle both /test and /notification/test)
router.get('/test', notificationController.testNotification);
router.get('/notification/test', notificationController.testNotification);

module.exports = router;

