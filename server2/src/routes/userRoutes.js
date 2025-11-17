import express from 'express';
import UserController from '../controllers/userController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', UserController.getAllUsers);

// Protected routes
router.get('/:id', UserController.getUserById);
router.put('/:id', authMiddleware, UserController.updateProfile);

module.exports = router;