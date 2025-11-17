// src/routes/connectionRoutes.js
const express = require('express');
const ConnectionController = require('../controllers/connectionController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.post('/connect', ConnectionController.sendConnectionRequest);
router.put('/:id/respond', ConnectionController.respondToConnection);
router.get('/', ConnectionController.getConnections);
router.get('/pending', ConnectionController.getPendingRequests);
router.get('/suggestions', ConnectionController.getConnectionSuggestions);

module.exports = router;