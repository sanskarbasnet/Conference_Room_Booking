const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { registerValidation, loginValidation } = require('../middleware/validators');

// Public routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.get('/verify', authController.verifyToken);

// Protected routes (require authentication)
router.get('/me', protect, authController.getProfile);
router.put('/me', protect, authController.updateProfile);

module.exports = router;

