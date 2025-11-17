// src/routes/eventRoutes.js
const express = require('express');
const EventController = require('../controllers/eventController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

// Public routes
router.get('/', EventController.getAllEvents);

// Protected routes
router.post('/', authMiddleware, roleMiddleware('TEACHER', 'ADMIN'), EventController.createEvent);
router.post('/:id/rsvp', authMiddleware, EventController.rsvpToEvent);
router.get('/:id/attendees', authMiddleware, EventController.getEventAttendees);

module.exports = router;