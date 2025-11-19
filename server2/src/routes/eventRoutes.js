import express from "express";
import EventController from "../controllers/eventController";
import authMiddleware from "../middleware/authMiddleware";
import roleMiddleware from "../middleware/roleMiddleware";

const router = express.Router();

// Public routes
router.get('/', EventController.getAllEvents);
router.get('/:id', EventController.getEventById);

// Protected routes
router.post('/', authMiddleware, roleMiddleware('TEACHER', 'ADMIN'), EventController.createEvent);
router.post('/:id/rsvp', authMiddleware, EventController.rsvpToEvent);
router.get('/:id/attendees', authMiddleware, EventController.getEventAttendees);
router.put('/:id', authMiddleware, EventController.updateEvent);
router.delete('/:id', authMiddleware, EventController.deleteEvent);


export default router