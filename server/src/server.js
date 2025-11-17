// src/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/verification', require('./routes/verificationRoutes'));
app.use('/api/connections', require('./routes/connectionRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/donations', require('./routes/donationRoutes'));
 

app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Alumni Connect Server is running',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(` Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});