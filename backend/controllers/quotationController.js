const prisma = require('../config/prisma');
const { toNumber } = require('../utils/serializers');
const { logActivity } = require('../services/activity');

const appendHistory = (existing, line) => {
  const ts = new Date().toISOString();
  return existing ? `${existing}\n[${ts}] ${line}` : `[${ts}] ${line}`;
};

const serialize = (q) => ({
  ...q,
  offeredAmount: toNumber(q.offeredAmount),
  counterAmount: q.counterAmount != null ? toNumber(q.counterAmount) : null,
});

const listQuotations = async (req, res) => {
  try {
    const rows = await prisma.quotation.findMany({
      orderBy: { id: 'desc' },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        product: { select: { id: true, name: true, category: true } },
      },
    });
    res.json(rows.map(serialize));
  } catch (error) {
    console.error('List quotations error:', error);
    res.status(500).json({ message: 'Failed to list quotations' });
  }
};

const createQuotation = async (req, res) => {
  try {
    const { customerId, productId, customerName, productName, days, offeredAmount, notes } =
      req.body || {};

    if (!customerName || !productName || offeredAmount == null) {
      return res.status(400).json({ message: 'customerName, productName, and offeredAmount are required' });
    }

    const history = appendHistory('', 'Quotation requested');
    const row = await prisma.quotation.create({
      data: {
        customerId: customerId != null ? Number(customerId) : null,
        productId: productId != null ? Number(productId) : null,
        customerName,
        productName,
        days: days != null ? Number(days) : 1,
        offeredAmount: Number(offeredAmount),
        notes: notes || '',
        history,
      },
    });

    await logActivity('quotation', `Quotation #${row.id} created for ${customerName}`, { id: row.id });
    res.status(201).json(serialize(row));
  } catch (error) {
    console.error('Create quotation error:', error);
    res.status(500).json({ message: 'Failed to create quotation' });
  }
};

const counterQuotation = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { counterAmount, notes } = req.body || {};

    if (counterAmount == null) {
      return res.status(400).json({ message: 'counterAmount is required' });
    }

    const existing = await prisma.quotation.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    const history = appendHistory(
      existing.history,
      `Counter offer: ${counterAmount}${notes ? ` — ${notes}` : ''}`
    );

    const row = await prisma.quotation.update({
      where: { id },
      data: {
        counterAmount: Number(counterAmount),
        status: 'Countered',
        notes: notes != null ? notes : existing.notes,
        history,
      },
    });

    await logActivity('quotation', `Counter offer on quotation #${id}`, { id, counterAmount });
    res.json(serialize(row));
  } catch (error) {
    console.error('Counter quotation error:', error);
    res.status(500).json({ message: 'Failed to counter quotation' });
  }
};

const approveQuotation = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.quotation.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    const history = appendHistory(existing.history, 'Quotation approved');
    const row = await prisma.quotation.update({
      where: { id },
      data: { status: 'Approved', history },
    });

    await logActivity('quotation', `Quotation #${id} approved`, { id });
    res.json(serialize(row));
  } catch (error) {
    console.error('Approve quotation error:', error);
    res.status(500).json({ message: 'Failed to approve quotation' });
  }
};

const rejectQuotation = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { reason } = req.body || {};
    const existing = await prisma.quotation.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    const history = appendHistory(
      existing.history,
      `Quotation rejected${reason ? `: ${reason}` : ''}`
    );
    const row = await prisma.quotation.update({
      where: { id },
      data: { status: 'Rejected', history },
    });

    await logActivity('quotation', `Quotation #${id} rejected`, { id, reason });
    res.json(serialize(row));
  } catch (error) {
    console.error('Reject quotation error:', error);
    res.status(500).json({ message: 'Failed to reject quotation' });
  }
};

module.exports = {
  listQuotations,
  createQuotation,
  counterQuotation,
  approveQuotation,
  rejectQuotation,
};
