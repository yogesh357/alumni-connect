const express = require('express');
const JobController = require('../controllers/jobController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

// Public routes
router.get('/', JobController.getAllJobs);
router.get('/categories', JobController.getJobCategories);

// Protected routes - Only Alumni, Teachers, Admins can post jobs
router.post('/', authMiddleware, roleMiddleware('ALUMNI', 'TEACHER', 'ADMIN'), JobController.createJobPosting);

module.exports = router;