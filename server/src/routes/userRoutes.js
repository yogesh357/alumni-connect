// src/routes/userRoutes.js
const express = require('express');
const UserController = require('../controllers/userController.js');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.get('/', UserController.getAllUsers);
//*remove this no need for it
router.get('/mentors', UserController.getMentors);

// Protected routes
router.get('/:id', UserController.getUserById);
router.put('/:id', authMiddleware, UserController.updateProfile);

module.exports = router;