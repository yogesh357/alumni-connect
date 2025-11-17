import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"
import prisma from '../../config/prisma'

class AuthController {

    static setTokenCookie(res, token) {
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
    }

    static generateToken(user) {
        return jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );
    }

    static async authRegister(req, res) {
        try {
            const { email, password, firstName, lastName, role, collegeEmail, branch, graduationYear } = req.body;

            if (role === 'ADMIN') {
                return res.status(403).json({
                    success: false,
                    message: 'Admin registration is not allowed through this route'
                });
            }

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

            // Validate college email for students
            if (role === 'STUDENT') {
                if (!collegeEmail) {
                    return res.status(400).json({
                        success: false,
                        message: 'College email is required for students'
                    });
                }

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

            const hashedPassword = await bcrypt.hash(password, 12);

            const isActive = false;

            const userData = {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                role,
                branch,
                graduationYear: graduationYear ? parseInt(graduationYear) : null,
                isActive: isActive
            };

            if (role === 'STUDENT') {
                userData.collegeEmail = collegeEmail;
            }

            const user = await prisma.user.create({
                data: userData
            });

            const token = this.generateToken(user);

            let message = "Registered successfully. Please wait for administrator verification.";

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

            const user = await prisma.user.findUnique({
                where: { email }
            });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            if (!user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'Account is pending verification. Please wait for administrator approval.'
                });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            const token = this.generateToken(user);
            this.setTokenCookie(res, token);

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

    static async logout(req, res) {
        try {
            // Clear the token cookie
            res.clearCookie('token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
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
    // Admin-only registration method
    static async registerAdmin(req, res) {
        try {
            const { email, password, firstName, lastName } = req.body;
            if (req.userRole !== 'ADMIN') {
                return res.status(403).json({
                    success: false,
                    message: "This route is only for admin registration"
                });
            }

            const existingUser = await prisma.user.findUnique({
                where: { email }
            });

            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'User already exists with this email'
                });
            }

            const hashedPassword = await bcrypt.hash(password, 12);

            const user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    firstName,
                    lastName,
                    role: 'ADMIN',
                    isActive: true
                }
            });

            // Generate and set token for immediate admin access
            const token = this.generateToken(user);
            this.setTokenCookie(res, token);

            res.status(201).json({
                success: true,
                message: 'Admin account created successfully',
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        role: user.role,
                        isActive: user.isActive
                    }
                    // Don't return token in response since it's in cookie
                }
            });

        } catch (error) {
            console.error('Admin registration error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during admin registration'
            });
        }
    }
}

module.exports = AuthController;