import prisma from '../../config/prisma'

class ConnectionController {
    static async sendConnectionRequest(req, res) {
        try {
            const { receiverId } = req.body;

            if (receiverId === req.userId) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot send connection request to yourself'
                });
            }

            // Check if connection already exists
            const existingConnection = await prisma.connection.findFirst({
                where: {
                    OR: [
                        { initiatorId: req.userId, receiverId },
                        { initiatorId: receiverId, receiverId: req.userId }
                    ]
                }
            });

            if (existingConnection) {
                return res.status(400).json({
                    success: false,
                    message: 'Connection already exists'
                });
            }

            const connection = await prisma.connection.create({
                data: {
                    initiatorId: req.userId,
                    receiverId,
                    status: 'PENDING'
                },
                include: {
                    receiver: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            avatar: true,
                            role: true,
                            currentJob: true,
                            currentCompany: true
                        }
                    }
                }
            });

            res.status(201).json({
                success: true,
                message: 'Connection request sent successfully',
                data: { connection }
            });

        } catch (error) {
            console.error('Send connection error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    static async respondToConnection(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body; // 'ACCEPTED' or 'REJECTED'

            const connection = await prisma.connection.findUnique({
                where: { id }
            });

            if (!connection) {
                return res.status(404).json({
                    success: false,
                    message: 'Connection request not found'
                });
            }

            if (connection.receiverId !== req.userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only respond to connection requests sent to you.'
                });
            }

            const updatedConnection = await prisma.connection.update({
                where: { id },
                data: { status },
                include: {
                    initiator: {
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
                message: `Connection request ${status.toLowerCase()}`,
                data: { connection: updatedConnection }
            });

        } catch (error) {
            console.error('Respond to connection error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    static async getConnections(req, res) {
        try {
            const connections = await prisma.connection.findMany({
                where: {
                    OR: [
                        { initiatorId: req.userId },
                        { receiverId: req.userId }
                    ],
                    status: 'ACCEPTED'
                },
                include: {
                    initiator: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            avatar: true,
                            role: true,
                            currentJob: true,
                            currentCompany: true
                        }
                    },
                    receiver: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            avatar: true,
                            role: true,
                            currentJob: true,
                            currentCompany: true
                        }
                    }
                }
            });

            // Format connections to show the other user
            const formattedConnections = connections.map(conn => ({
                id: conn.id,
                user: conn.initiatorId === req.userId ? conn.receiver : conn.initiator,
                connectedAt: conn.createdAt
            }));

            res.json({
                success: true,
                data: { connections: formattedConnections }
            });

        } catch (error) {
            console.error('Get connections error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    static async getPendingRequests(req, res) {
        try {
            const requests = await prisma.connection.findMany({
                where: {
                    receiverId: req.userId,
                    status: 'PENDING'
                },
                include: {
                    initiator: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            avatar: true,
                            role: true,
                            currentJob: true,
                            currentCompany: true,
                            bio: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            res.json({
                success: true,
                data: { requests }
            });

        } catch (error) {
            console.error('Get pending requests error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    static async getConnectionSuggestions(req, res) {
        try {
            // Get current user
            const currentUser = await prisma.user.findUnique({
                where: { id: req.userId },
                select: {
                    branch: true,
                    graduationYear: true,
                    skills: true,
                    currentCompany: true
                }
            });

            // Get users with similar attributes (excluding already connected users)
            const suggestions = await prisma.user.findMany({
                where: {
                    id: { not: req.userId },
                    isActive: true,
                    verificationStatus: 'APPROVED',
                    OR: [
                        { branch: currentUser.branch },
                        { graduationYear: currentUser.graduationYear },
                        { currentCompany: currentUser.currentCompany },
                        { skills: { hasSome: currentUser.skills } }
                    ],
                    NOT: {
                        OR: [
                            { connectionsAsInitiator: { some: { receiverId: req.userId } } },
                            { connectionsAsReceiver: { some: { initiatorId: req.userId } } }
                        ]
                    }
                },
                take: 10,
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                    role: true,
                    currentJob: true,
                    currentCompany: true,
                    graduationYear: true,
                    skills: true,
                    branch: true
                }
            });

            res.json({
                success: true,
                data: { suggestions }
            });

        } catch (error) {
            console.error('Get suggestions error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}

export default ConnectionController