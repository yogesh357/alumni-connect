import express from 'express'
import VerificationController from '../controllers/verificationController'
import roleMiddleware from '../middleware/roleMiddleware'

const router = express.Router();

router.get('/pending', authMiddleware, roleMiddleware('ADMIN', 'DPU_STAFF'), VerificationController.getPendingRequests);
router.post('/:id/approve', authMiddleware, roleMiddleware('ADMIN', 'DPU_STAFF'), VerificationController.approveRequest);
router.post('/:id/reject', authMiddleware, roleMiddleware('ADMIN', 'DPU_STAFF'), VerificationController.rejectRequest);
router.get('/stats', authMiddleware, roleMiddleware('ADMIN', 'DPU_STAFF'), VerificationController.getStats);

export default router