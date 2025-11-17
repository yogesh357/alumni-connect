// src/routes/verificationRoutes.js
const express = require('express');
const VerificationController = require('../controllers/verificationController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

// Admin/DPU staff only routes
router.get('/pending', authMiddleware, roleMiddleware('ADMIN', 'DPU_STAFF'), VerificationController.getPendingRequests);
router.post('/:id/approve', authMiddleware, roleMiddleware('ADMIN', 'DPU_STAFF'), VerificationController.approveRequest);
router.post('/:id/reject', authMiddleware, roleMiddleware('ADMIN', 'DPU_STAFF'), VerificationController.rejectRequest);
router.get('/stats', authMiddleware, roleMiddleware('ADMIN', 'DPU_STAFF'), VerificationController.getStats);

module.exports = router;