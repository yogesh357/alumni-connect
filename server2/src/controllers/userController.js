//  getAll user , geruserById , updateProfile

import prisma from '../../config/prisma'

class UserController {
    static async getAllUsers(req, res) {
        try {
            const { page = 1, limit = 10, role, search, branch } = req.query;
            const skip = (page - 1) * limit;

            const where = {
                isActive: true,
                verificationStatus: 'APPROVED'
            };

            if (role) where.role = role;
            if (branch) where.branch = branch;
            if (search) {
                where.OR = [
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { currentCompany: { contains: search, mode: 'insensitive' } }
                ];
            }

            const users = await prisma.user.findMany({
                where,
                skip: parseInt(skip),
                take: parseInt(limit),
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    role: true,
                    avatar: true,
                    currentJob: true,
                    currentCompany: true,
                    graduationYear: true,
                    skills: true,
                    isMentor: true,
                    branch: true
                },
                orderBy: { createdAt: 'desc' }
            });

            const total = await prisma.user.count({ where });

            res.json({
                success: true,
                data: {
                    users,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        pages: Math.ceil(total / limit)
                    }
                }
            });

        } catch (error) {
            console.error('Get users error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    static async getUserById(req, res) {
        try {
            const { id } = req.params;

            const user = await prisma.user.findUnique({
                where: { id },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    avatar: true,
                    bio: true,
                    graduationYear: true,
                    currentJob: true,
                    currentCompany: true,
                    skills: true,
                    isMentor: true,
                    mentorshipAreas: true,
                    branch: true,
                    collegeEmail: true,
                    profile: true,
                    createdAt: true
                }
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                data: { user }
            });

        } catch (error) {
            console.error('Get user error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    static async updateProfile(req, res) {
        try {
            const { id } = req.params;

            if (id !== req.userId && req.userRole !== 'ADMIN') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only update your own profile.'
                });
            }

            const {
                firstName,
                lastName,
                bio,
                currentJob,
                currentCompany,
                skills,
                graduationYear
            } = req.body;

            const updatedUser = await prisma.user.update({
                where: { id },
                data: {
                    firstName,
                    lastName,
                    bio,
                    currentJob,
                    currentCompany,
                    skills: skills || [],
                    graduationYear: graduationYear ? parseInt(graduationYear) : null
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    role: true,
                    avatar: true,
                    bio: true,
                    currentJob: true,
                    currentCompany: true,
                    skills: true,
                    graduationYear: true
                }
            });

            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: { user: updatedUser }
            });

        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

}

module.exports = UserController