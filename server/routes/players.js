const express = require('express');
const router = express.Router();
const prisma = require('../prisma/client');

// GET /api/players — returns all players merged with approved UserProfiles
router.get('/', async (req, res) => {
  try {
    const [players, approvedProfiles] = await Promise.all([
      prisma.player.findMany({ orderBy: { name: 'asc' } }),
      prisma.userProfile.findMany({
        where: { status: 'approved' },
        select: { id: true, fullName: true, utrSingles: true, ustaRating: true, email: true },
        orderBy: { fullName: 'asc' },
      }),
    ])

    const playerNames = new Set(players.map(p => p.name.toLowerCase()))
    const merged = [...players]

    for (const profile of approvedProfiles) {
      if (!playerNames.has(profile.fullName.toLowerCase())) {
        merged.push({
          id: `profile_${profile.id}`,
          name: profile.fullName,
          ustaRating: profile.utrSingles || profile.ustaRating || 'N/A',
          phone: null,
          notes: null,
          isRegistered: true,
          profileId: profile.id,
        })
      }
    }

    merged.sort((a, b) => a.name.localeCompare(b.name))
    res.json(merged)
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/players/:id
router.get('/:id', async (req, res) => {
  try {
    const player = await prisma.player.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!player) return res.status(404).json({ error: 'Player not found' });
    res.json(player);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/players
router.post('/', async (req, res) => {
  const { name, ustaRating, phone, notes } = req.body;
  if (!name || !ustaRating) {
    return res.status(400).json({ error: 'name and ustaRating are required' });
  }
  try {
    const player = await prisma.player.create({
      data: { name, ustaRating, phone: phone || null, notes: notes || null },
    });
    res.status(201).json(player);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/players/:id
router.put('/:id', async (req, res) => {
  const { name, ustaRating, phone, notes } = req.body;
  if (!name || !ustaRating) {
    return res.status(400).json({ error: 'name and ustaRating are required' });
  }
  try {
    const player = await prisma.player.update({
      where: { id: parseInt(req.params.id) },
      data: { name, ustaRating, phone: phone || null, notes: notes || null },
    });
    res.json(player);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Player not found' });
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/players/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.player.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Player deleted' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Player not found' });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
