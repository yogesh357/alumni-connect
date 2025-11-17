// src/routes/postRoutes.js
const express = require('express');
const PostController = require('../controllers/postController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.get('/', PostController.getAllPosts);
router.get('/:id', PostController.getPostById);

// Protected routes
router.post('/', authMiddleware, PostController.createPost);
router.post('/:id/like', authMiddleware, PostController.likePost);
router.post('/:id/comments', authMiddleware, PostController.addComment);
router.delete('/:id', authMiddleware, PostController.deletePost);

module.exports = router;