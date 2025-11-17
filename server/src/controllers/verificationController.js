// src/controllers/verificationController.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class VerificationController {
    static async getPendingRequests(req, res) {
        try {
            const { page = 1, limit = 10 } = req.query;
            const skip = (page - 1) * limit;

            const requests = await prisma.verificationRequest.findMany({
                where: { status: 'PENDING' },
                skip: parseInt(skip),
                take: parseInt(limit),
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            role: true,
                            collegeEmail: true,
                            branch: true,
                            graduationYear: true
                        }
                    }
                },
                orderBy: { createdAt: 'asc' }
            });

            const total = await prisma.verificationRequest.count({
                where: { status: 'PENDING' }
            });

            res.json({
                success: true,
                data: {
                    requests,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        pages: Math.ceil(total / limit)
                    }
                }
            });

        } catch (error) {
            console.error('Get pending requests error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    static async approveRequest(req, res) {
        try {
            const { id } = req.params;
            const { reviewNotes } = req.body;

            const verificationRequest = await prisma.verificationRequest.findUnique({
                where: { id },
                include: { user: true }
            });

            if (!verificationRequest) {
                return res.status(404).json({
                    success: false,
                    message: 'Verification request not found'
                });
            }

            // Update user status
            await prisma.user.update({
                where: { id: verificationRequest.userId },
                data: {
                    verificationStatus: 'APPROVED',
                    isActive: true
                }
            });

            // Update verification request
            await prisma.verificationRequest.update({
                where: { id },
                data: {
                    status: 'APPROVED',
                    reviewedBy: req.userId,
                    reviewNotes,
                    reviewedAt: new Date()
                }
            });

            res.json({
                success: true,
                message: 'User verification approved successfully'
            });

        } catch (error) {
            console.error('Approve request error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    static async rejectRequest(req, res) {
        try {
            const { id } = req.params;
            const { reviewNotes } = req.body;

            const verificationRequest = await prisma.verificationRequest.findUnique({
                where: { id }
            });

            if (!verificationRequest) {
                return res.status(404).json({
                    success: false,
                    message: 'Verification request not found'
                });
            }

            await prisma.verificationRequest.update({
                where: { id },
                data: {
                    status: 'REJECTED',
                    reviewedBy: req.userId,
                    reviewNotes,
                    reviewedAt: new Date()
                }
            });

            res.json({
                success: true,
                message: 'User verification rejected'
            });

        } catch (error) {
            console.error('Reject request error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    static async getStats(req, res) {
        try {
            const totalPending = await prisma.verificationRequest.count({
                where: { status: 'PENDING' }
            });

            const totalApproved = await prisma.verificationRequest.count({
                where: { status: 'APPROVED' }
            });

            const totalRejected = await prisma.verificationRequest.count({
                where: { status: 'REJECTED' }
            });

            res.json({
                success: true,
                data: {
                    pending: totalPending,
                    approved: totalApproved,
                    rejected: totalRejected,
                    total: totalPending + totalApproved + totalRejected
                }
            });

        } catch (error) {
            console.error('Get stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}

module.exports = VerificationController;