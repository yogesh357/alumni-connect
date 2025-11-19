import MessageController from '../controllers/messageController';
import authMiddleware from '../middleware/authMiddleware';
import express from 'express';


const router = express.Router();

router.use(authMiddleware);

router.post('/', MessageController.sendMessage);
router.get('/conversations', MessageController.getConversations);
router.get('/:userId', MessageController.getMessagesWithUser);

export default router