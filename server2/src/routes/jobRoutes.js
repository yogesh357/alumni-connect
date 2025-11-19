import express from 'express'
import JobController from '../controllers/jobController';
import authMiddleware from '../middleware/authMiddleware';
import roleMiddleware from '../middleware/roleMiddleware';

const router = express.Router();

// Public routes
router.get('/', JobController.getAllJobs);
router.get('/categories', JobController.getJobCategories);

// Protected routes - Only Alumni, Teachers, Admins can post jobs
router.post('/', authMiddleware, roleMiddleware('ALUMNI', 'TEACHER', 'ADMIN'), JobController.createJobPosting);

export default router