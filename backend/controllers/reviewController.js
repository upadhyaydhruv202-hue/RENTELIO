const prisma = require('../config/prisma');
const { logActivity } = require('../services/activity');

const ALLOWED_MODERATION = ['Approved', 'Hidden', 'Deleted'];

const createReview = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { productId, rentalId, rating, comment } = req.body || {};

    if (!productId || rating == null) {
      return res.status(400).json({ message: 'productId and rating are required' });
    }

    const score = Number(rating);
    if (score < 1 || score > 5) {
      return res.status(400).json({ message: 'rating must be between 1 and 5' });
    }

    const row = await prisma.review.create({
      data: {
        customerId,
        productId: Number(productId),
        rentalId: rentalId != null ? Number(rentalId) : null,
        rating: score,
        comment: comment || '',
        status: 'Pending',
      },
      include: {
        customer: { select: { id: true, name: true } },
        product: { select: { id: true, name: true } },
      },
    });

    await logActivity('review', `Review submitted for product #${productId}`, { id: row.id });
    res.status(201).json(row);
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Failed to create review' });
  }
};

const adminListReviews = async (req, res) => {
  try {
    const status = req.query.status;
    const rows = await prisma.review.findMany({
      where: status ? { status } : undefined,
      orderBy: { id: 'desc' },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        product: { select: { id: true, name: true, category: true } },
      },
    });
    res.json(rows);
  } catch (error) {
    console.error('Admin list reviews error:', error);
    res.status(500).json({ message: 'Failed to list reviews' });
  }
};

const moderateReview = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body || {};

    if (!ALLOWED_MODERATION.includes(status)) {
      return res.status(400).json({
        message: `status must be one of: ${ALLOWED_MODERATION.join(', ')}`,
      });
    }

    const row = await prisma.review.update({
      where: { id },
      data: { status },
    });

    await logActivity('review', `Review #${id} moderated to ${status}`, { id, status });
    res.json(row);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Review not found' });
    }
    console.error('Moderate review error:', error);
    res.status(500).json({ message: 'Failed to moderate review' });
  }
};

const reportReview = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const row = await prisma.review.update({
      where: { id },
      data: { reported: true },
    });

    await logActivity('review', `Review #${id} reported`, { id });
    res.json(row);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Review not found' });
    }
    console.error('Report review error:', error);
    res.status(500).json({ message: 'Failed to report review' });
  }
};

module.exports = { createReview, adminListReviews, moderateReview, reportReview };
