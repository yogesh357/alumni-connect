const express = require('express');
const DonationController = require('../controllers/donationController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Public route
router.get('/funds', DonationController.getFundDetails);

// Protected routes
router.post('/', authMiddleware, DonationController.createDonation);
router.get('/my-donations', authMiddleware, DonationController.getUserDonations);

module.exports = router;