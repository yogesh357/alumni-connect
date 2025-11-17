const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class DonationController {
  static async createDonation(req, res) {
    try {
      const { amount, paymentMethod } = req.body;

      // In a real app, you would integrate with Razorpay here
      // This is a simplified version
      const donation = await prisma.donation.create({
        data: {
          amount: parseFloat(amount),
          paymentMethod,
          donorId: req.userId,
          paymentStatus: 'COMPLETED' // Simplified - in real app, this would be PENDING initially
        },
        include: {
          donor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      });

      // Update fund totals
      await this.updateFundTotals(parseFloat(amount));

      res.status(201).json({
        success: true,
        message: 'Donation completed successfully',
        data: { donation }
      });

    } catch (error) {
      console.error('Create donation error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  static async updateFundTotals(amount) {
    try {
      const fund = await prisma.fund.findFirst();
      
      if (fund) {
        await prisma.fund.update({
          where: { id: fund.id },
          data: {
            totalDonations: fund.totalDonations + amount,
            availableBalance: fund.availableBalance + amount,
            lastUpdated: new Date()
          }
        });
      } else {
        await prisma.fund.create({
          data: {
            totalDonations: amount,
            availableBalance: amount,
            lastUpdated: new Date()
          }
        });
      }
    } catch (error) {
      console.error('Update fund totals error:', error);
    }
  }

  static async getUserDonations(req, res) {
    try {
      const donations = await prisma.donation.findMany({
        where: { donorId: req.userId },
        orderBy: { createdAt: 'desc' },
        include: {
          donor: {
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
        data: { donations }
      });

    } catch (error) {
      console.error('Get donations error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  static async getFundDetails(req, res) {
    try {
      const fund = await prisma.fund.findFirst();
      const expenses = await prisma.expense.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      res.json({
        success: true,
        data: {
          fund: fund || {
            totalDonations: 0,
            totalExpenses: 0,
            availableBalance: 0
          },
          recentExpenses: expenses
        }
      });

    } catch (error) {
      console.error('Get fund details error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = DonationController;