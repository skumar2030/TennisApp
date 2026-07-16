const express = require('express');
const router = express.Router();
const prisma = require('../prisma/client');
const { requireAuth } = require('../middleware/auth');

const CATEGORIES = ['match_fee', 'court_rental', 'equipment', 'strings', 'footwear', 'coaching', 'apparel', 'other'];

// Parse "YYYY-MM-DD" as local midnight (not UTC)
function parseLocalDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const CATEGORY_LABELS = {
  match_fee: 'Match Fee',
  court_rental: 'Court Rental',
  equipment: 'Equipment',
  strings: 'Strings & Maintenance',
  footwear: 'Footwear',
  coaching: 'Coaching',
  apparel: 'Apparel',
  other: 'Other',
};

// Build where clause from query filters, scoped to user
function buildWhere({ playerId, category, from, to }, userId, isAdmin) {
  const where = {};
  // Scope to user's own expenses unless admin
  if (!isAdmin) {
    where.createdByUserId = userId;
  }
  if (playerId) where.paidById = parseInt(playerId);
  if (category) where.category = category;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = parseLocalDate(from);
    if (to) {
      const toDate = parseLocalDate(to);
      toDate.setHours(23, 59, 59, 999);
      where.date.lte = toDate;
    }
  }
  return where;
}

// All expense routes require authentication
router.use(requireAuth);

// GET /api/expenses
router.get('/', async (req, res) => {
  try {
    const where = buildWhere(req.query, req.user.sub, req.isAdmin);
    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        paidBy: { select: { id: true, name: true } },
        match: { select: { id: true, dateTime: true, location: true } },
        splits: { include: { player: { select: { id: true, name: true } } } },
      },
    });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/expenses/summary
router.get('/summary', async (req, res) => {
  const { period = 'monthly', playerId } = req.query;
  try {
    const where = {};
    // Scope to user's expenses unless admin
    if (!req.isAdmin) {
      where.createdByUserId = req.user.sub;
    }

    const pid = playerId ? parseInt(playerId) : null;
    if (pid) {
      where.OR = [
        { paidById: pid, ...(where.createdByUserId ? { createdByUserId: where.createdByUserId } : {}) },
        { splits: { some: { playerId: pid } }, ...(where.createdByUserId ? { createdByUserId: where.createdByUserId } : {}) },
      ];
      delete where.createdByUserId;
    }

    const now = new Date();
    let from, to;
    if (period === 'daily') {
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (period === 'weekly') {
      const day = now.getDay();
      from = new Date(now);
      from.setDate(now.getDate() - day);
      from.setHours(0, 0, 0, 0);
      to = new Date(from);
      to.setDate(from.getDate() + 6);
      to.setHours(23, 59, 59, 999);
    } else if (period === 'monthly') {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (period === 'yearly') {
      from = new Date(now.getFullYear(), 0, 1);
      to = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    }
    if (from) where.date = { gte: from, lte: to };

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        paidBy: { select: { id: true, name: true } },
        splits: { include: { player: { select: { id: true, name: true } } } },
      },
    });

    function relevantAmount(e) {
      if (!pid) return e.amount;
      const split = e.splits.find(s => s.playerId === pid);
      if (split) return split.shareAmount;
      if (e.paidById === pid) return e.amount;
      return 0;
    }

    const total = expenses.reduce((sum, e) => sum + relevantAmount(e), 0);

    // By category
    const byCategory = {};
    for (const cat of CATEGORIES) {
      const catExpenses = expenses.filter(e => e.category === cat);
      if (catExpenses.length > 0) {
        const catTotal = catExpenses.reduce((sum, e) => sum + relevantAmount(e), 0);
        if (catTotal > 0) {
          byCategory[cat] = {
            label: CATEGORY_LABELS[cat],
            total: catTotal,
            count: catExpenses.length,
          };
        }
      }
    }

    // By player (who paid)
    const byPlayer = {};
    for (const e of expenses) {
      const payerId = e.paidBy.id;
      if (!byPlayer[payerId]) byPlayer[payerId] = { name: e.paidBy.name, total: 0, count: 0 };
      byPlayer[payerId].total += e.amount;
      byPlayer[payerId].count += 1;
    }

    res.json({ period, total, byCategory, byPlayer, count: expenses.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/expenses/export  — CSV download
router.get('/export', async (req, res) => {
  try {
    const where = buildWhere(req.query, req.user.sub, req.isAdmin);
    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        paidBy: { select: { name: true } },
        match: { select: { dateTime: true, location: true } },
        splits: { include: { player: { select: { name: true } } } },
      },
    });

    const rows = [
      ['Date', 'Paid By', 'Category', 'Amount (USD)', 'Match Date', 'Match Location', 'Splits', 'Notes'],
    ];

    for (const e of expenses) {
      const splitStr = e.splits.length > 0
        ? e.splits.map(s => `${s.player.name}: $${s.shareAmount.toFixed(2)}`).join(' | ')
        : '';
      rows.push([
        new Date(e.date).toLocaleDateString('en-US'),
        e.paidBy.name,
        CATEGORY_LABELS[e.category] || e.category,
        e.amount.toFixed(2),
        e.match ? new Date(e.match.dateTime).toLocaleDateString('en-US') : '',
        e.match?.location || '',
        splitStr,
        e.notes || '',
      ]);
    }

    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="tennis-expenses.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/expenses/:id
router.get('/:id', async (req, res) => {
  try {
    const where = { id: parseInt(req.params.id) };
    // Scope to user unless admin
    if (!req.isAdmin) {
      where.createdByUserId = req.user.sub;
    }
    const expense = await prisma.expense.findFirst({
      where,
      include: {
        paidBy: { select: { id: true, name: true } },
        match: { select: { id: true, dateTime: true, location: true } },
        splits: { include: { player: { select: { id: true, name: true } } } },
      },
    });
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/expenses
router.post('/', async (req, res) => {
  const { date, category, amount, paidById, matchId, notes, splits } = req.body;
  if (!date || !category || amount == null || !paidById) {
    return res.status(400).json({ error: 'date, category, amount, and paidById are required' });
  }
  if (!CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `Invalid category. Must be one of: ${CATEGORIES.join(', ')}` });
  }
  if (isNaN(parseFloat(amount)) || parseFloat(amount) < 0) {
    return res.status(400).json({ error: 'amount must be a non-negative number' });
  }
  try {
    const expense = await prisma.expense.create({
      data: {
        date: parseLocalDate(date),
        category,
        amount: parseFloat(amount),
        paidById: parseInt(paidById),
        matchId: matchId ? parseInt(matchId) : null,
        notes: notes || null,
        createdByUserId: req.user.sub,
        splits: splits?.length > 0 ? {
          create: splits.map(s => ({
            playerId: parseInt(s.playerId),
            shareAmount: parseFloat(s.shareAmount),
          })),
        } : undefined,
      },
      include: {
        paidBy: { select: { id: true, name: true } },
        match: { select: { id: true, dateTime: true, location: true } },
        splits: { include: { player: { select: { id: true, name: true } } } },
      },
    });
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/expenses/:id
router.put('/:id', async (req, res) => {
  const { date, category, amount, paidById, matchId, notes, splits } = req.body;
  if (!date || !category || amount == null || !paidById) {
    return res.status(400).json({ error: 'date, category, amount, and paidById are required' });
  }
  try {
    // Verify ownership unless admin
    const existing = await prisma.expense.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!existing) return res.status(404).json({ error: 'Expense not found' });
    if (!req.isAdmin && existing.createdByUserId !== req.user.sub) {
      return res.status(403).json({ error: 'You can only edit your own expenses' });
    }

    // Delete existing splits and recreate
    await prisma.expenseSplit.deleteMany({ where: { expenseId: parseInt(req.params.id) } });

    const expense = await prisma.expense.update({
      where: { id: parseInt(req.params.id) },
      data: {
        date: parseLocalDate(date),
        category,
        amount: parseFloat(amount),
        paidById: parseInt(paidById),
        matchId: matchId ? parseInt(matchId) : null,
        notes: notes || null,
        splits: splits?.length > 0 ? {
          create: splits.map(s => ({
            playerId: parseInt(s.playerId),
            shareAmount: parseFloat(s.shareAmount),
          })),
        } : undefined,
      },
      include: {
        paidBy: { select: { id: true, name: true } },
        match: { select: { id: true, dateTime: true, location: true } },
        splits: { include: { player: { select: { id: true, name: true } } } },
      },
    });
    res.json(expense);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Expense not found' });
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', async (req, res) => {
  try {
    // Verify ownership unless admin
    const existing = await prisma.expense.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!existing) return res.status(404).json({ error: 'Expense not found' });
    if (!req.isAdmin && existing.createdByUserId !== req.user.sub) {
      return res.status(403).json({ error: 'You can only delete your own expenses' });
    }

    await prisma.expense.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Expense not found' });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
