import prisma from "../../config/prisma";

class PostController {
    static async createPost(req, res) {
        try {
            const { title, content, image, isPublic = true, category } = req.body;

            const post = await prisma.post.create({
                data: {
                    title,
                    content,
                    image,
                    isPublic,
                    category,
                    authorId: req.userId
                },
                include: {
                    author: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            avatar: true,
                            role: true
                        }
                    }
                }
            });

            res.status(201).json({
                success: true,
                message: 'Post created successfully',
                data: { post }
            });

        } catch (error) {
            console.error('Create post error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    static async getAllPosts(req, res) {
        try {
            const { page = 1, limit = 10, category } = req.query;
            const skip = (page - 1) * limit;

            const where = {
                isPublic: true
            };

            if (category) where.category = category;

            const posts = await prisma.post.findMany({
                where,
                skip: parseInt(skip),
                take: parseInt(limit),
                include: {
                    author: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            avatar: true,
                            role: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            const total = await prisma.post.count({ where });

            res.json({
                success: true,
                data: {
                    posts,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        pages: Math.ceil(total / limit)
                    }
                }
            });

        } catch (error) {
            console.error('Get posts error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    static async getPostById(req, res) {
        try {
            const { id } = req.params;

            const post = await prisma.post.findUnique({
                where: { id },
                include: {
                    author: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            avatar: true,
                            role: true
                        }
                    }
                }
            });

            if (!post) {
                return res.status(404).json({
                    success: false,
                    message: 'Post not found'
                });
            }

            res.json({
                success: true,
                data: { post }
            });

        } catch (error) {
            console.error('Get post error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    static async updatePost(req, res) {
        try {
            const { id } = req.params;
            const { title, content, image, isPublic, category } = req.body;

            const post = await prisma.post.findUnique({
                where: { id }
            });

            if (!post) {
                return res.status(404).json({
                    success: false,
                    message: 'Post not found'
                });
            }

            // Check if user owns the post or is admin
            if (post.authorId !== req.userId && req.userRole !== 'ADMIN') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only update your own posts.'
                });
            }

            const updatedPost = await prisma.post.update({
                where: { id },
                data: {
                    title,
                    content,
                    image,
                    isPublic,
                    category
                },
                include: {
                    author: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            avatar: true,
                            role: true
                        }
                    }
                }
            });

            res.json({
                success: true,
                message: 'Post updated successfully',
                data: { post: updatedPost }
            });

        } catch (error) {
            console.error('Update post error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    static async deletePost(req, res) {
        try {
            const { id } = req.params;

            const post = await prisma.post.findUnique({
                where: { id }
            });

            if (!post) {
                return res.status(404).json({
                    success: false,
                    message: 'Post not found'
                });
            }

            // Check if user owns the post or is admin
            if (post.authorId !== req.userId && req.userRole !== 'ADMIN') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only delete your own posts.'
                });
            }

            await prisma.post.delete({
                where: { id }
            });

            res.json({
                success: true,
                message: 'Post deleted successfully'
            });

        } catch (error) {
            console.error('Delete post error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
 
    static async getMyPosts(req, res) {
        try {
            const { page = 1, limit = 10 } = req.query;
            const skip = (page - 1) * limit;

            const posts = await prisma.post.findMany({
                where: {
                    authorId: req.userId
                },
                skip: parseInt(skip),
                take: parseInt(limit),
                include: {
                    author: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            avatar: true,
                            role: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            const total = await prisma.post.count({
                where: { authorId: req.userId }
            });

            res.json({
                success: true,
                data: {
                    posts,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        pages: Math.ceil(total / limit)
                    }
                }
            });

        } catch (error) {
            console.error('Get my posts error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}

export default PostController;