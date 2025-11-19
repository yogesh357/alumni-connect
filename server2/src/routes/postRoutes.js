import PostController from "../controllers/postController";
import authMiddleware from "../middleware/authMiddleware";
import express from "express";

const router = express.Router();

router.get('/', PostController.getAllPosts);
router.get('/:id', PostController.getPostById);

// Protected routes
router.post('/', authMiddleware, PostController.createPost);
router.put('/:id', authMiddleware, PostController.updatePost);
router.delete('/:id', authMiddleware, PostController.deletePost);
router.get('/user/my-posts', authMiddleware, PostController.getMyPosts);

export default router