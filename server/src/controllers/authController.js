// src/controllers/authController.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

class AuthController {
    static async register(req, res) {
        try {
            const { email, password, firstName, lastName, role, collegeEmail, branch, graduationYear } = req.body;

            // Check if user already exists
            const existingUser = await prisma.user.findUnique({
                where: { email }
            });

            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'User already exists with this email'
                });
            }

            //: role == 'STUDENT'
            if (role === 'STUDENT') {
                if (!collegeEmail) {
                    return res.status(400).json({
                        success: false,
                        message: 'College email is required for students'
                    });
                }

                // Check if college email is already used
                const existingCollegeEmail = await prisma.user.findUnique({
                    where: { collegeEmail }
                });

                if (existingCollegeEmail) {
                    return res.status(400).json({
                        success: false,
                        message: 'College email is already registered'
                    });
                }
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 12);

            // Create user - DIFFERENT LOGIC FOR DIFFERENT ROLES:
            const userData = {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                role,
                branch,
                graduationYear: graduationYear ? parseInt(graduationYear) : null,
            };

            // Add college email ONLY for students
            if (role === 'STUDENT') {
                userData.collegeEmail = collegeEmail;
                userData.isActive = false; // Students need verification
            } else {
                userData.isActive = true;
            }

            const user = await prisma.user.create({
                data: userData
            });

            // Generate JWT token
            const token = jwt.sign(
                { userId: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '7d' }
            );

            let message = 'User registered successfully';
            if (role === 'STUDENT') {
                message = 'Student registered successfully. Please wait for administrator verification.';
            }

            res.status(201).json({
                success: true,
                message: message,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        role: user.role,
                        isActive: user.isActive,
                        collegeEmail: user.collegeEmail
                    },
                    token
                }
            });

        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during registration'
            });
        }
    }

    static async login(req, res) {
        try {
            const { email, password } = req.body;

            // Find user
            const user = await prisma.user.findUnique({
                where: { email }
            });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            // Check if user is active
            if (!user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'Account is deactivated. Please contact administrator.'
                });
            }

            // Check password
            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            // Generate JWT token
            const token = jwt.sign(
                { userId: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '7d' }
            );

            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        role: user.role,
                        avatar: user.avatar,
                        isMentor: user.isMentor,
                        isActive: user.isActive
                    },
                    token
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during login'
            });
        }
    }

    static async getCurrentUser(req, res) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: req.userId },
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
                    isActive: true,
                    branch: true,
                    collegeEmail: true
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
            console.error('Get current user error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    static async logout(req, res) {
        try {
            // Clear the HTTP-only cookie
            res.clearCookie('token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });

            res.json({
                success: true,
                message: 'Logout successful'
            });
        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({
                success: false,
                message: 'Logout failed'
            });
        }
    }
}

module.exports = AuthController;