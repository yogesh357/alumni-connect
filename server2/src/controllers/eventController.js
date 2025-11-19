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
                            response: true  // Changed from rsvps to response
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
                            response: true  // Changed from rsvps to response
                        }
                    },
                    response: {  // Changed from rsvps to response
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
                userRsvpStatus: event.response[0]?.status || null,  // Changed from rsvps to response
                rsvpCount: event._count.response  // Changed from rsvps to response
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

            const response = await prisma.eventResponse.upsert({  // Changed from eventRSVP to eventResponse
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
                data: { response }  // Changed from rsvp to response
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

            const attendees = await prisma.eventResponse.findMany({  // Changed from eventRSVP to eventResponse
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

    // Additional useful methods:

    static async getEventById(req, res) {
        try {
            const { id } = req.params;

            const event = await prisma.event.findUnique({
                where: { id },
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
                    response: {  // Include all responses for this event
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
                    },
                    _count: {
                        select: {
                            response: true
                        }
                    }
                }
            });

            if (!event) {
                return res.status(404).json({
                    success: false,
                    message: 'Event not found'
                });
            }

            res.json({
                success: true,
                data: { event }
            });

        } catch (error) {
            console.error('Get event error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    static async updateEvent(req, res) {
        try {
            const { id } = req.params;
            const {
                title,
                description,
                date,
                location,
                isVirtual,
                meetingLink,
                image,
                maxAttendees,
                branch
            } = req.body;

            const event = await prisma.event.findUnique({
                where: { id }
            });

            if (!event) {
                return res.status(404).json({
                    success: false,
                    message: 'Event not found'
                });
            }

            // Check if user is the creator or admin
            if (event.creatorId !== req.userId && req.userRole !== 'ADMIN') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only update your own events.'
                });
            }

            const updatedEvent = await prisma.event.update({
                where: { id },
                data: {
                    title,
                    description,
                    date: date ? new Date(date) : undefined,
                    location,
                    isVirtual,
                    meetingLink,
                    image,
                    maxAttendees: maxAttendees ? parseInt(maxAttendees) : null,
                    branch
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
                            response: true
                        }
                    }
                }
            });

            res.json({
                success: true,
                message: 'Event updated successfully',
                data: { event: updatedEvent }
            });

        } catch (error) {
            console.error('Update event error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    static async deleteEvent(req, res) {
        try {
            const { id } = req.params;

            const event = await prisma.event.findUnique({
                where: { id }
            });

            if (!event) {
                return res.status(404).json({
                    success: false,
                    message: 'Event not found'
                });
            }

            // Check if user is the creator or admin
            if (event.creatorId !== req.userId && req.userRole !== 'ADMIN') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only delete your own events.'
                });
            }

            await prisma.event.delete({
                where: { id }
            });

            res.json({
                success: true,
                message: 'Event deleted successfully'
            });

        } catch (error) {
            console.error('Delete event error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}

module.exports = EventController;