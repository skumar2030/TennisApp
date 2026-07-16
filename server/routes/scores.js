const express = require('express');
const router = express.Router();
const prisma = require('../prisma/client');

// GET /api/matches/:id/score
router.get('/:id/score', async (req, res) => {
  try {
    const scores = await prisma.score.findMany({
      where: { matchId: parseInt(req.params.id) },
      orderBy: { setNumber: 'asc' },
    });
    res.json(scores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/matches/:id/score
// Body: { sets: [{ team1Games, team2Games, tiebreak? }], winnerId? }
router.post('/:id/score', async (req, res) => {
  const matchId = parseInt(req.params.id);
  const { sets } = req.body;

  if (!sets || !Array.isArray(sets) || sets.length === 0) {
    return res.status(400).json({ error: 'sets array is required' });
  }
  if (sets.length > 3) {
    return res.status(400).json({ error: 'Maximum 3 sets allowed' });
  }

  for (const set of sets) {
    if (set.team1Games == null || set.team2Games == null) {
      return res.status(400).json({ error: 'Each set must have team1Games and team2Games' });
    }
  }

  try {
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) return res.status(404).json({ error: 'Match not found' });

    // Delete existing scores and replace
    await prisma.score.deleteMany({ where: { matchId } });

    const scoreData = sets.map((s, i) => ({
      matchId,
      setNumber: i + 1,
      team1Games: parseInt(s.team1Games),
      team2Games: parseInt(s.team2Games),
      tiebreak: s.tiebreak || null,
    }));

    await prisma.score.createMany({ data: scoreData });

    // Auto-determine winner by sets won and mark match as completed
    const team1Sets = sets.filter(s => parseInt(s.team1Games) > parseInt(s.team2Games)).length;
    const team2Sets = sets.filter(s => parseInt(s.team2Games) > parseInt(s.team1Games)).length;
    const winner = team1Sets > team2Sets ? 'team1' : team2Sets > team1Sets ? 'team2' : 'tie';

    const updated = await prisma.match.update({
      where: { id: matchId },
      data: { status: 'completed', winner },
      include: {
        matchPlayers: { include: { player: true }, orderBy: [{ team: 'asc' }, { role: 'asc' }] },
        scores: { orderBy: { setNumber: 'asc' } },
      },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
