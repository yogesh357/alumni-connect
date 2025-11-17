import express from 'express';
import AuthController from '../controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';

const router = express.Router();

// Only authenticated ADMINS can access these routes
router.post('/register', authMiddleware, roleMiddleware('ADMIN'), AuthController.registerAdmin);

module.exports = router;