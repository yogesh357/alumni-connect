const { default: prisma } = require("../../config/prisma");



class MessageController {
    static async sendMessage(req, res) {
        try {
            const { receiverId, content } = req.body;

            if (receiverId === req.userId) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot send message to yourself'
                });
            }

            const message = await prisma.message.create({
                data: {
                    content,
                    senderId: req.userId,
                    receiverId
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            avatar: true
                        }
                    },
                    receiver: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            avatar: true
                        }
                    }
                }
            });

            res.status(201).json({
                success: true,
                message: 'Message sent successfully',
                data: { message }
            });

        } catch (error) {
            console.error('Send message error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    static async getConversations(req, res) {
        try {
            // Get all unique conversations for the current user
            const sentMessages = await prisma.message.findMany({
                where: { senderId: req.userId },
                distinct: ['receiverId'],
                include: {
                    receiver: {
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

            const receivedMessages = await prisma.message.findMany({
                where: { receiverId: req.userId },
                distinct: ['senderId'],
                include: {
                    sender: {
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

            // Combine and deduplicate conversations
            const conversations = [];
            const seenUsers = new Set();

            [...sentMessages, ...receivedMessages].forEach(msg => {
                const otherUser = msg.senderId === req.userId ? msg.receiver : msg.sender;

                if (!seenUsers.has(otherUser.id)) {
                    seenUsers.add(otherUser.id);
                    conversations.push({
                        user: otherUser,
                        lastMessage: msg.content,
                        lastMessageAt: msg.createdAt,
                        unread: false // You can implement unread count logic
                    });
                }
            });

            res.json({
                success: true,
                data: { conversations }
            });

        } catch (error) {
            console.error('Get conversations error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    static async getMessagesWithUser(req, res) {
        try {
            const { userId } = req.params;
            const { page = 1, limit = 20 } = req.query;
            const skip = (page - 1) * limit;

            const messages = await prisma.message.findMany({
                where: {
                    OR: [
                        { senderId: req.userId, receiverId: userId },
                        { senderId: userId, receiverId: req.userId }
                    ]
                },
                skip: parseInt(skip),
                take: parseInt(limit),
                include: {
                    sender: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            avatar: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            // Mark messages as read
            await prisma.message.updateMany({
                where: {
                    senderId: userId,
                    receiverId: req.userId,
                    isRead: false
                },
                data: { isRead: true }
            });

            const total = await prisma.message.count({
                where: {
                    OR: [
                        { senderId: req.userId, receiverId: userId },
                        { senderId: userId, receiverId: req.userId }
                    ]
                }
            });

            res.json({
                success: true,
                data: {
                    messages: messages.reverse(), // Reverse to show oldest first
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        pages: Math.ceil(total / limit)
                    }
                }
            });

        } catch (error) {
            console.error('Get messages error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}
export default MessageController