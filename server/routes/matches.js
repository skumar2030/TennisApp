const express = require('express');
const router = express.Router();
const prisma = require('../prisma/client');

// GET /api/matches?status=upcoming|past|all
router.get('/', async (req, res) => {
  const { status } = req.query;
  const now = new Date();

  let where = {};
  if (status === 'upcoming') {
    where = {
      status: { not: 'cancelled' },
      OR: [
        { dateTime: { gte: now } },
        { status: 'scheduled' },
      ],
    };
  } else if (status === 'past') {
    where = { status: { in: ['completed', 'cancelled'] } };
  }

  try {
    const matches = await prisma.match.findMany({
      where,
      orderBy: { dateTime: 'asc' },
      include: {
        matchPlayers: {
          include: { player: true },
          orderBy: [{ team: 'asc' }, { role: 'asc' }],
        },
        scores: { orderBy: { setNumber: 'asc' } },
      },
    });
    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/matches/:id
router.get('/:id', async (req, res) => {
  try {
    const match = await prisma.match.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        matchPlayers: {
          include: { player: true },
          orderBy: [{ team: 'asc' }, { role: 'asc' }],
        },
        scores: { orderBy: { setNumber: 'asc' } },
      },
    });
    if (!match) return res.status(404).json({ error: 'Match not found' });
    res.json(match);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/matches
router.post('/', async (req, res) => {
  const { dateTime, location, matchType, notes, players } = req.body;

  if (!dateTime || !location || !matchType) {
    return res.status(400).json({ error: 'dateTime, location, and matchType are required' });
  }
  if (!['singles', 'doubles'].includes(matchType)) {
    return res.status(400).json({ error: 'matchType must be singles or doubles' });
  }

  try {
    const match = await prisma.match.create({
      data: {
        dateTime: new Date(dateTime),
        location,
        matchType,
        notes: notes || null,
        matchPlayers: {
          create: buildMatchPlayers(matchType, players),
        },
      },
      include: {
        matchPlayers: { include: { player: true } },
      },
    });
    res.status(201).json(match);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/matches/:id
router.put('/:id', async (req, res) => {
  const { dateTime, location, matchType, notes, players } = req.body;

  if (!dateTime || !location || !matchType) {
    return res.status(400).json({ error: 'dateTime, location, and matchType are required' });
  }

  try {
    // Delete existing matchPlayers and recreate
    await prisma.matchPlayer.deleteMany({ where: { matchId: parseInt(req.params.id) } });

    const match = await prisma.match.update({
      where: { id: parseInt(req.params.id) },
      data: {
        dateTime: new Date(dateTime),
        location,
        matchType,
        notes: notes || null,
        matchPlayers: {
          create: buildMatchPlayers(matchType, players),
        },
      },
      include: {
        matchPlayers: { include: { player: true } },
      },
    });
    res.json(match);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Match not found' });
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/matches/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.match.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Match deleted' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Match not found' });
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/matches/:id/cancel
router.patch('/:id/cancel', async (req, res) => {
  try {
    const match = await prisma.match.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'cancelled' },
    });
    res.json(match);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Match not found' });
    res.status(500).json({ error: err.message });
  }
});

// Helper: build matchPlayers array from request body
function buildMatchPlayers(matchType, players = {}) {
  if (matchType === 'singles') {
    return [
      { team: 1, role: 'player1', playerId: players.team1p1 || null, tbdName: players.team1p1 ? null : (players.team1p1Name || null) },
      { team: 2, role: 'player1', playerId: players.team2p1 || null, tbdName: players.team2p1 ? null : (players.team2p1Name || null) },
    ];
  } else {
    return [
      { team: 1, role: 'player1', playerId: players.team1p1 || null, tbdName: players.team1p1 ? null : (players.team1p1Name || null) },
      { team: 1, role: 'player2', playerId: players.team1p2 || null, tbdName: players.team1p2 ? null : (players.team1p2Name || null) },
      { team: 2, role: 'player1', playerId: players.team2p1 || null, tbdName: players.team2p1 ? null : (players.team2p1Name || null) },
      { team: 2, role: 'player2', playerId: players.team2p2 || null, tbdName: players.team2p2 ? null : (players.team2p2Name || null) },
    ];
  }
}

module.exports = router;
