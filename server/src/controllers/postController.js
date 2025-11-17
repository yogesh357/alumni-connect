// src/controllers/postController.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

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
                    },
                    _count: {
                        select: {
                            likes: true,
                            comments: true
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
                    },
                    _count: {
                        select: {
                            likes: true,
                            comments: true
                        }
                    },
                    likes: {
                        where: {
                            userId: req.userId
                        },
                        select: {
                            userId: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            const total = await prisma.post.count({ where });

            // Check if user liked each post
            const postsWithLikes = posts.map(post => ({
                ...post,
                likedByUser: post.likes.length > 0,
                likes: post._count.likes,
                comments: post._count.comments
            }));

            res.json({
                success: true,
                data: {
                    posts: postsWithLikes,
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
                    },
                    likes: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    avatar: true
                                }
                            }
                        }
                    },
                    comments: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    avatar: true,
                                    role: true
                                }
                            }
                        },
                        orderBy: { createdAt: 'asc' }
                    },
                    _count: {
                        select: {
                            likes: true,
                            comments: true
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

    static async likePost(req, res) {
        try {
            const { id } = req.params;

            // Check if already liked
            const existingLike = await prisma.like.findUnique({
                where: {
                    userId_postId: {
                        userId: req.userId,
                        postId: id
                    }
                }
            });

            if (existingLike) {
                // Unlike the post
                await prisma.like.delete({
                    where: {
                        userId_postId: {
                            userId: req.userId,
                            postId: id
                        }
                    }
                });

                return res.json({
                    success: true,
                    message: 'Post unliked',
                    data: { liked: false }
                });
            }

            // Like the post
            await prisma.like.create({
                data: {
                    userId: req.userId,
                    postId: id
                }
            });

            res.json({
                success: true,
                message: 'Post liked',
                data: { liked: true }
            });

        } catch (error) {
            console.error('Like post error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    static async addComment(req, res) {
        try {
            const { id } = req.params;
            const { content } = req.body;

            const comment = await prisma.comment.create({
                data: {
                    content,
                    userId: req.userId,
                    postId: id
                },
                include: {
                    user: {
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
                message: 'Comment added successfully',
                data: { comment }
            });

        } catch (error) {
            console.error('Add comment error:', error);
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
}

module.exports = PostController;