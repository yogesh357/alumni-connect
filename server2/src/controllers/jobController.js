import prisma from '../../config/prisma';
import { JobCategory } from '@prisma/client';

class JobController {
    static async createJobPosting(req, res) {
        try {
            const {
                title,
                description,
                company,
                location,
                isRemote = false,
                employmentType,
                salaryRange,
                applyLink,
                expiryDate,
                jobCategory
            } = req.body;

            const job = await prisma.jobPosting.create({
                data: {
                    title,
                    description,
                    company,
                    location,
                    isRemote,
                    employmentType,
                    salaryRange,
                    applyLink,
                    expiryDate: expiryDate ? new Date(expiryDate) : null,
                    jobCategory,
                    posterId: req.userId
                },
                include: {
                    poster: {
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
                message: 'Job posting created successfully',
                data: { job }
            });

        } catch (error) {
            console.error('Create job error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    static async getAllJobs(req, res) {
        try {
            const { page = 1, limit = 10, category, employmentType, search } = req.query;
            const skip = (page - 1) * limit;

            const where = {
                isActive: true,
                OR: [
                    { expiryDate: null },
                    { expiryDate: { gt: new Date() } }
                ]
            };

            if (category) where.jobCategory = category;
            if (employmentType) where.employmentType = employmentType;
            if (search) {
                where.OR = [
                    { title: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                    { company: { contains: search, mode: 'insensitive' } }
                ];
            }

            const jobs = await prisma.jobPosting.findMany({
                where,
                skip: parseInt(skip),
                take: parseInt(limit),
                include: {
                    poster: {
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

            const total = await prisma.jobPosting.count({ where });

            res.json({
                success: true,
                data: {
                    jobs,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        pages: Math.ceil(total / limit)
                    }
                }
            });

        } catch (error) {
            console.error('Get jobs error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }


    static async getJobCategories(req, res) {
        try {
            const categories = Object.values(JobCategory);

            res.json({
                success: true,
                data: {
                    categories,
                    count: categories.length
                }
            });
        } catch (error) {
            console.error('Get categories error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}

export default JobController