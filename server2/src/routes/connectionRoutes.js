import express from 'express'
import ConnectionController from '../controllers/connectionController';
import authMiddleware from '../middleware/authMiddleware';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.post('/connect', ConnectionController.sendConnectionRequest);
router.put('/:id/respond', ConnectionController.respondToConnection);
router.get('/', ConnectionController.getConnections);
router.get('/pending', ConnectionController.getPendingRequests);
router.get('/suggestions', ConnectionController.getConnectionSuggestions);

export default router