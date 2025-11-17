const express = require('express');
const MessageController = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.post('/', MessageController.sendMessage);
router.get('/conversations', MessageController.getConversations);
router.get('/:userId', MessageController.getMessagesWithUser);

module.exports = router;