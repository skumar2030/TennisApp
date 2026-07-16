const express = require('express');
const router = express.Router();
const prisma = require('../prisma/client');

// GET /api/matches/:id/points — all points for a match
router.get('/:id/points', async (req, res) => {
  try {
    const points = await prisma.point.findMany({
      where: { matchId: parseInt(req.params.id) },
      orderBy: [{ setNumber: 'asc' }, { gameNumber: 'asc' }, { pointNumber: 'asc' }],
    });
    res.json(points);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/matches/:id/points — add a point
router.post('/:id/points', async (req, res) => {
  const matchId = parseInt(req.params.id);
  const { setNumber, gameNumber, pointNumber, serverId, winner, outcome, shotType, direction, serveType, serveIn, rallyCount, comment } = req.body;

  if (!setNumber || !gameNumber || pointNumber == null || !serverId || !winner || !outcome) {
    return res.status(400).json({ error: 'setNumber, gameNumber, pointNumber, serverId, winner, and outcome are required' });
  }

  try {
    const point = await prisma.point.create({
      data: {
        matchId,
        setNumber,
        gameNumber,
        pointNumber,
        serverId,
        winner,
        outcome,
        shotType: shotType || null,
        direction: direction || null,
        serveType: serveType || null,
        serveIn: serveIn != null ? serveIn : null,
        rallyCount: rallyCount != null ? parseInt(rallyCount) : null,
        comment: comment || null,
      },
    });
    res.status(201).json(point);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/matches/:id/points/:pointId — undo last point
router.delete('/:id/points/:pointId', async (req, res) => {
  try {
    await prisma.point.delete({ where: { id: parseInt(req.params.pointId) } });
    res.json({ message: 'Point deleted' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Point not found' });
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/matches/:id/points — clear all points for a match
router.delete('/:id/points', async (req, res) => {
  try {
    await prisma.point.deleteMany({ where: { matchId: parseInt(req.params.id) } });
    res.json({ message: 'All points cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/matches/:id/comments — all comments for a match
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await prisma.matchComment.findMany({
      where: { matchId: parseInt(req.params.id) },
      orderBy: { createdAt: 'asc' },
    });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/matches/:id/comments — add a comment
router.post('/:id/comments', async (req, res) => {
  const matchId = parseInt(req.params.id);
  const { scope, setNumber, gameNumber, comment } = req.body;

  if (!scope || !comment) {
    return res.status(400).json({ error: 'scope and comment are required' });
  }

  try {
    const mc = await prisma.matchComment.create({
      data: {
        matchId,
        scope,
        setNumber: setNumber || null,
        gameNumber: gameNumber || null,
        comment,
      },
    });
    res.status(201).json(mc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/matches/:id/stats — computed match stats
router.get('/:id/stats', async (req, res) => {
  try {
    const match = await prisma.match.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { matchPlayers: { include: { player: true } } },
    });
    if (!match) return res.status(404).json({ error: 'Match not found' });

    const points = await prisma.point.findMany({
      where: { matchId: parseInt(req.params.id) },
      orderBy: [{ setNumber: 'asc' }, { gameNumber: 'asc' }, { pointNumber: 'asc' }],
    });

    const comments = await prisma.matchComment.findMany({
      where: { matchId: parseInt(req.params.id) },
      orderBy: { createdAt: 'asc' },
    });

    if (points.length === 0) {
      return res.json({ match, points: [], comments, stats: null });
    }

    const team1 = match.matchPlayers.filter(p => p.team === 1);
    const team2 = match.matchPlayers.filter(p => p.team === 2);

    const stats = { team1: {}, team2: {} };

    for (const teamKey of ['team1', 'team2']) {
      const teamNum = teamKey === 'team1' ? 1 : 2;
      const teamPoints = points.filter(p => p.winner === teamNum);
      const opponentNum = teamNum === 1 ? 2 : 1;

      // Basic counts
      stats[teamKey].totalPointsWon = teamPoints.length;
      stats[teamKey].aces = points.filter(p => p.winner === teamNum && p.outcome === 'ace').length;
      stats[teamKey].doubleFaults = points.filter(p => p.serverId === teamNum && p.outcome === 'double_fault').length;
      stats[teamKey].winners = points.filter(p => p.winner === teamNum && p.outcome === 'winner').length;
      stats[teamKey].forcedErrors = points.filter(p => p.winner === teamNum && p.outcome === 'forced_error').length;
      stats[teamKey].unforcedErrors = points.filter(p => p.winner === opponentNum && p.outcome === 'unforced_error' && p.serverId === teamNum).length
        + points.filter(p => p.winner === opponentNum && p.outcome === 'unforced_error' && p.serverId === opponentNum).length;
      // Actually: unforced errors BY this team = points lost by this team due to unforced error
      stats[teamKey].unforcedErrors = points.filter(p => p.winner === opponentNum && p.outcome === 'unforced_error').length;
      // Wait, that's opponent's UEs causing this team to win. Let me fix:
      // UEs committed BY team = points where opponent won and outcome is unforced_error and the error was by this team
      // Since winner is the team that WON the point, and outcome describes HOW, if outcome is 'unforced_error', the loser made the UE
      // So UEs by team1 = points where winner === 2 and outcome === 'unforced_error'... but we don't know WHO made the error
      // Let's simplify: UEs by this team = points this team LOST where outcome = unforced_error
      stats[teamKey].unforcedErrors = points.filter(p => p.winner === opponentNum && p.outcome === 'unforced_error').length;
      stats[teamKey].returnErrors = points.filter(p => p.winner === opponentNum && p.outcome === 'return_error').length;

      // Serve stats
      const servePoints = points.filter(p => p.serverId === teamNum);
      const firstServes = servePoints.filter(p => p.serveType === 'first');
      const firstServesIn = firstServes.filter(p => p.serveIn === true);
      const secondServes = servePoints.filter(p => p.serveType === 'second');
      const secondServesIn = secondServes.filter(p => p.serveIn === true);

      stats[teamKey].firstServeTotal = firstServes.length;
      stats[teamKey].firstServeIn = firstServesIn.length;
      stats[teamKey].firstServePct = firstServes.length > 0 ? Math.round((firstServesIn.length / firstServes.length) * 100) : 0;
      stats[teamKey].secondServeTotal = secondServes.length;
      stats[teamKey].secondServeIn = secondServesIn.length;
      stats[teamKey].secondServePct = secondServes.length > 0 ? Math.round((secondServesIn.length / secondServes.length) * 100) : 0;

      // Points won on serve
      const servePointsWon = servePoints.filter(p => p.winner === teamNum);
      stats[teamKey].servicePointsWon = servePointsWon.length;
      stats[teamKey].servicePointsTotal = servePoints.length;

      // Points won on return
      const returnPoints = points.filter(p => p.serverId === opponentNum);
      const returnPointsWon = returnPoints.filter(p => p.winner === teamNum);
      stats[teamKey].returnPointsWon = returnPointsWon.length;
      stats[teamKey].returnPointsTotal = returnPoints.length;

      // Break points (simplified: games where returner won)
      // We'll track this from game-level analysis below

      // Shot type breakdown for winners
      stats[teamKey].winnersByShot = {};
      for (const p of teamPoints.filter(p => p.outcome === 'winner' || p.outcome === 'ace')) {
        const st = p.shotType || 'unknown';
        stats[teamKey].winnersByShot[st] = (stats[teamKey].winnersByShot[st] || 0) + 1;
      }

      // Direction breakdown
      stats[teamKey].winnersByDirection = {};
      for (const p of teamPoints.filter(p => (p.outcome === 'winner' || p.outcome === 'ace') && p.direction)) {
        stats[teamKey].winnersByDirection[p.direction] = (stats[teamKey].winnersByDirection[p.direction] || 0) + 1;
      }

      // Rally length stats
      const rallies = teamPoints.filter(p => p.rallyCount != null).map(p => p.rallyCount);
      if (rallies.length > 0) {
        stats[teamKey].avgRallyLength = Math.round(rallies.reduce((a, b) => a + b, 0) / rallies.length * 10) / 10;
        stats[teamKey].maxRally = Math.max(...rallies);
      }

      // Net points (volleys + overheads)
      stats[teamKey].netPointsWon = teamPoints.filter(p => p.shotType === 'volley' || p.shotType === 'overhead').length;
    }

    // Break points analysis
    // Group points by set and game
    const gameGroups = {};
    for (const p of points) {
      const key = `${p.setNumber}-${p.gameNumber}`;
      if (!gameGroups[key]) gameGroups[key] = { serverId: p.serverId, points: [] };
      gameGroups[key].points.push(p);
    }

    for (const teamKey of ['team1', 'team2']) {
      const teamNum = teamKey === 'team1' ? 1 : 2;
      let breakPointsConverted = 0;
      let breakPointsFaced = 0;
      let breakPointsTotal = 0;
      let breakPointsSaved = 0;

      // Break points FOR this team = games where opponent served and this team won
      // Break points AGAINST this team = games where this team served and opponent won
      for (const game of Object.values(gameGroups)) {
        if (game.serverId === teamNum) {
          // This team serving — opponent had break point opportunities if they won
          const opponentWins = game.points.filter(p => p.winner !== teamNum).length;
          if (opponentWins > 0) {
            // Simplified: count games broken
            const lastPoint = game.points[game.points.length - 1];
            if (lastPoint && lastPoint.winner !== teamNum) {
              breakPointsFaced++;
            }
          }
        } else {
          // Opponent serving — this team has break point opportunities
          const lastPoint = game.points[game.points.length - 1];
          if (lastPoint && lastPoint.winner === teamNum) {
            breakPointsConverted++;
          }
          breakPointsTotal++;
        }
      }

      stats[teamKey].breakPointsConverted = breakPointsConverted;
      stats[teamKey].breakPointsFaced = breakPointsFaced;
    }

    res.json({ match, points, comments, stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
