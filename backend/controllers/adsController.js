const prisma = require('../config/prisma');

const listActiveByPlacement = async (req, res) => {
  try {
    const placement = req.params.placement || req.query.placement || 'home';
    const now = new Date();

    const rows = await prisma.advertisement.findMany({
      where: {
        active: true,
        placement,
        OR: [
          { startsAt: null, endsAt: null },
          { startsAt: { lte: now }, endsAt: null },
          { startsAt: null, endsAt: { gte: now } },
          { startsAt: { lte: now }, endsAt: { gte: now } },
        ],
      },
      orderBy: { id: 'desc' },
    });

    res.json(rows);
  } catch (error) {
    console.error('List active ads error:', error);
    res.status(500).json({ message: 'Failed to load advertisements' });
  }
};

const adminListAds = async (req, res) => {
  try {
    const rows = await prisma.advertisement.findMany({ orderBy: { id: 'desc' } });
    res.json(rows);
  } catch (error) {
    console.error('Admin list ads error:', error);
    res.status(500).json({ message: 'Failed to list advertisements' });
  }
};

const createAd = async (req, res) => {
  try {
    const { title, body, imageUrl, linkUrl, placement, active, startsAt, endsAt } = req.body || {};
    if (!title) {
      return res.status(400).json({ message: 'title is required' });
    }

    const row = await prisma.advertisement.create({
      data: {
        title,
        body: body || '',
        imageUrl: imageUrl || '',
        linkUrl: linkUrl || '',
        placement: placement || 'home',
        active: active !== false,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
      },
    });

    res.status(201).json(row);
  } catch (error) {
    console.error('Create ad error:', error);
    res.status(500).json({ message: 'Failed to create advertisement' });
  }
};

const updateAd = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { title, body, imageUrl, linkUrl, placement, active, startsAt, endsAt } = req.body || {};

    const existing = await prisma.advertisement.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Advertisement not found' });
    }

    const row = await prisma.advertisement.update({
      where: { id },
      data: {
        ...(title != null && { title }),
        ...(body != null && { body }),
        ...(imageUrl != null && { imageUrl }),
        ...(linkUrl != null && { linkUrl }),
        ...(placement != null && { placement }),
        ...(active != null && { active: Boolean(active) }),
        ...(startsAt !== undefined && { startsAt: startsAt ? new Date(startsAt) : null }),
        ...(endsAt !== undefined && { endsAt: endsAt ? new Date(endsAt) : null }),
      },
    });

    res.json(row);
  } catch (error) {
    console.error('Update ad error:', error);
    res.status(500).json({ message: 'Failed to update advertisement' });
  }
};

const deleteAd = async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.advertisement.delete({ where: { id } });
    res.json({ message: 'Advertisement deleted' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Advertisement not found' });
    }
    console.error('Delete ad error:', error);
    res.status(500).json({ message: 'Failed to delete advertisement' });
  }
};

module.exports = {
  listActiveByPlacement,
  adminListAds,
  createAd,
  updateAd,
  deleteAd,
};
