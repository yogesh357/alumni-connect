// src/controllers/eventController.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class EventController {
    static async createEvent(req, res) {
        try {
            const {
                title,
                description,
                date,
                location,
                isVirtual = false,
                meetingLink,
                image,
                maxAttendees,
                branch
            } = req.body;

            const event = await prisma.event.create({
                data: {
                    title,
                    description,
                    date: new Date(date),
                    location,
                    isVirtual,
                    meetingLink,
                    image,
                    maxAttendees: maxAttendees ? parseInt(maxAttendees) : null,
                    branch,
                    creatorId: req.userId
                },
                include: {
                    creator: {
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
                            rsvps: true
                        }
                    }
                }
            });

            res.status(201).json({
                success: true,
                message: 'Event created successfully',
                data: { event }
            });

        } catch (error) {
            console.error('Create event error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    static async getAllEvents(req, res) {
        try {
            const { page = 1, limit = 10, branch, upcoming = true } = req.query;
            const skip = (page - 1) * limit;

            const where = {};

            if (branch) where.branch = branch;

            if (upcoming === 'true') {
                where.date = { gte: new Date() };
            }

            const events = await prisma.event.findMany({
                where,
                skip: parseInt(skip),
                take: parseInt(limit),
                include: {
                    creator: {
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
                            rsvps: true
                        }
                    },
                    rsvps: {
                        where: {
                            userId: req.userId
                        },
                        select: {
                            status: true
                        }
                    }
                },
                orderBy: { date: 'asc' }
            });

            const total = await prisma.event.count({ where });

            // Add user's RSVP status to each event
            const eventsWithUserStatus = events.map(event => ({
                ...event,
                userRsvpStatus: event.rsvps[0]?.status || null,
                rsvpCount: event._count.rsvps
            }));

            res.json({
                success: true,
                data: {
                    events: eventsWithUserStatus,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        pages: Math.ceil(total / limit)
                    }
                }
            });

        } catch (error) {
            console.error('Get events error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    static async rsvpToEvent(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const event = await prisma.event.findUnique({
                where: { id }
            });

            if (!event) {
                return res.status(404).json({
                    success: false,
                    message: 'Event not found'
                });
            }

            // Check if event is in the past
            if (new Date(event.date) < new Date()) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot RSVP to past events'
                });
            }

            const rsvp = await prisma.eventRSVP.upsert({
                where: {
                    eventId_userId: {
                        eventId: id,
                        userId: req.userId
                    }
                },
                update: {
                    status
                },
                create: {
                    eventId: id,
                    userId: req.userId,
                    status
                },
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
            });

            res.json({
                success: true,
                message: `RSVP ${status.toLowerCase()} for event`,
                data: { rsvp }
            });

        } catch (error) {
            console.error('RSVP error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    static async getEventAttendees(req, res) {
        try {
            const { id } = req.params;

            const attendees = await prisma.eventRSVP.findMany({
                where: {
                    eventId: id,
                    status: 'GOING'
                },
                include: {
                    user: {
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

            res.json({
                success: true,
                data: { attendees }
            });

        } catch (error) {
            console.error('Get attendees error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}

module.exports = EventController;