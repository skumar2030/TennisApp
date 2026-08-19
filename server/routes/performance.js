const express = require('express');
const router = express.Router();
const prisma = require('../prisma/client');

// GET /api/performance/player/:playerId — aggregated stats for a player
router.get('/player/:playerId', async (req, res) => {
  const playerId = parseInt(req.params.playerId);
  try {
    const matches = await prisma.match.findMany({
      where: {
        status: 'completed',
        matchPlayers: { some: { playerId } },
      },
      include: {
        matchPlayers: { include: { player: true } },
        scores: { orderBy: { setNumber: 'asc' } },
      },
      orderBy: { dateTime: 'desc' },
    });

    let wins = 0, losses = 0, singlesWins = 0, singlesLosses = 0, doublesWins = 0, doublesLosses = 0;
    const recentMatches = [];

    for (const match of matches) {
      const slot = match.matchPlayers.find(mp => mp.playerId === playerId);
      if (!slot) continue;
      const playerTeam = `team${slot.team}`;
      const won = match.winner === playerTeam;

      if (won) { wins++; if (match.matchType === 'singles') singlesWins++; else doublesWins++; }
      else { losses++; if (match.matchType === 'singles') singlesLosses++; else doublesLosses++; }

      const team1 = match.matchPlayers.filter(p => p.team === 1);
      const team2 = match.matchPlayers.filter(p => p.team === 2);

      recentMatches.push({
        id: match.id,
        dateTime: match.dateTime,
        location: match.location,
        matchType: match.matchType,
        won,
        team1: team1.map(p => p.player?.name || p.tbdName || 'TBD'),
        team2: team2.map(p => p.player?.name || p.tbdName || 'TBD'),
        playerTeam: slot.team,
        scores: match.scores,
      });
    }

    // Aggregate point-level stats across all matches
    const matchIds = matches.map(m => m.id);
    const allPoints = matchIds.length > 0 ? await prisma.point.findMany({
      where: { matchId: { in: matchIds } },
    }) : [];

    const aggStats = {
      totalPointsWon: 0, totalPointsPlayed: 0,
      aces: 0, doubleFaults: 0, winners: 0, unforcedErrors: 0, forcedErrors: 0,
      firstServeIn: 0, firstServeTotal: 0,
      servicePointsWon: 0, servicePointsTotal: 0,
      returnPointsWon: 0, returnPointsTotal: 0,
      netPointsWon: 0,
    };

    if (allPoints.length > 0) {
      for (const match of matches) {
        const slot = match.matchPlayers.find(mp => mp.playerId === playerId);
        if (!slot) continue;
        const teamNum = slot.team;
        const opponentNum = teamNum === 1 ? 2 : 1;
        const matchPoints = allPoints.filter(p => p.matchId === match.id);

        aggStats.totalPointsPlayed += matchPoints.length;
        aggStats.totalPointsWon += matchPoints.filter(p => p.winner === teamNum).length;
        aggStats.aces += matchPoints.filter(p => p.winner === teamNum && p.outcome === 'ace').length;
        aggStats.doubleFaults += matchPoints.filter(p => p.serverId === teamNum && p.outcome === 'double_fault').length;
        aggStats.winners += matchPoints.filter(p => p.winner === teamNum && p.outcome === 'winner').length;
        aggStats.unforcedErrors += matchPoints.filter(p => p.winner === opponentNum && p.outcome === 'unforced_error').length;
        aggStats.forcedErrors += matchPoints.filter(p => p.winner === teamNum && p.outcome === 'forced_error').length;

        const servePoints = matchPoints.filter(p => p.serverId === teamNum);
        const firstServes = servePoints.filter(p => p.serveType === 'first');
        aggStats.firstServeIn += firstServes.filter(p => p.serveIn === true).length;
        aggStats.firstServeTotal += firstServes.length;
        aggStats.servicePointsWon += servePoints.filter(p => p.winner === teamNum).length;
        aggStats.servicePointsTotal += servePoints.length;

        const returnPoints = matchPoints.filter(p => p.serverId === opponentNum);
        aggStats.returnPointsWon += returnPoints.filter(p => p.winner === teamNum).length;
        aggStats.returnPointsTotal += returnPoints.length;

        aggStats.netPointsWon += matchPoints.filter(p => p.winner === teamNum && (p.shotType === 'volley' || p.shotType === 'overhead')).length;
      }
    }

    const hasPointData = allPoints.length > 0;

    res.json({
      playerId,
      totalMatches: matches.length,
      wins, losses,
      winRate: matches.length > 0 ? Math.round((wins / matches.length) * 100) : 0,
      singlesRecord: { wins: singlesWins, losses: singlesLosses },
      doublesRecord: { wins: doublesWins, losses: doublesLosses },
      stats: hasPointData ? {
        ...aggStats,
        firstServePct: aggStats.firstServeTotal > 0 ? Math.round((aggStats.firstServeIn / aggStats.firstServeTotal) * 100) : null,
        serviceWinPct: aggStats.servicePointsTotal > 0 ? Math.round((aggStats.servicePointsWon / aggStats.servicePointsTotal) * 100) : null,
        returnWinPct: aggStats.returnPointsTotal > 0 ? Math.round((aggStats.returnPointsWon / aggStats.returnPointsTotal) * 100) : null,
      } : null,
      recentMatches: recentMatches.slice(0, 20),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/performance/head-to-head?player1=X&player2=Y
router.get('/head-to-head', async (req, res) => {
  const p1 = parseInt(req.query.player1);
  const p2 = parseInt(req.query.player2);
  if (!p1 || !p2) return res.status(400).json({ error: 'player1 and player2 are required' });

  try {
    const matches = await prisma.match.findMany({
      where: {
        status: 'completed',
        AND: [
          { matchPlayers: { some: { playerId: p1 } } },
          { matchPlayers: { some: { playerId: p2 } } },
        ],
      },
      include: {
        matchPlayers: { include: { player: true } },
        scores: { orderBy: { setNumber: 'asc' } },
      },
      orderBy: { dateTime: 'desc' },
    });

    let p1Wins = 0, p2Wins = 0;
    const matchDetails = [];

    for (const match of matches) {
      const slot1 = match.matchPlayers.find(mp => mp.playerId === p1);
      const slot2 = match.matchPlayers.find(mp => mp.playerId === p2);
      if (!slot1 || !slot2) continue;

      const sameTeam = slot1.team === slot2.team;
      if (sameTeam) continue;

      const p1Won = match.winner === `team${slot1.team}`;
      const p2Won = match.winner === `team${slot2.team}`;
      if (p1Won) p1Wins++;
      if (p2Won) p2Wins++;

      const team1 = match.matchPlayers.filter(p => p.team === 1);
      const team2 = match.matchPlayers.filter(p => p.team === 2);

      matchDetails.push({
        id: match.id,
        dateTime: match.dateTime,
        location: match.location,
        matchType: match.matchType,
        winner: p1Won ? 'player1' : p2Won ? 'player2' : null,
        team1: team1.map(p => p.player?.name || p.tbdName || 'TBD'),
        team2: team2.map(p => p.player?.name || p.tbdName || 'TBD'),
        p1Team: slot1.team,
        p2Team: slot2.team,
        scores: match.scores,
      });
    }

    // Aggregate point stats for both players across these matches
    const matchIds = matches.map(m => m.id);
    const allPoints = matchIds.length > 0 ? await prisma.point.findMany({
      where: { matchId: { in: matchIds } },
    }) : [];

    const buildPlayerStats = (pid) => {
      const s = { pointsWon: 0, aces: 0, winners: 0, unforcedErrors: 0, doubleFaults: 0 };
      for (const match of matches) {
        const slot = match.matchPlayers.find(mp => mp.playerId === pid);
        if (!slot) continue;
        const teamNum = slot.team;
        const oppNum = teamNum === 1 ? 2 : 1;
        const mp = allPoints.filter(p => p.matchId === match.id);
        s.pointsWon += mp.filter(p => p.winner === teamNum).length;
        s.aces += mp.filter(p => p.winner === teamNum && p.outcome === 'ace').length;
        s.winners += mp.filter(p => p.winner === teamNum && p.outcome === 'winner').length;
        s.unforcedErrors += mp.filter(p => p.winner === oppNum && p.outcome === 'unforced_error').length;
        s.doubleFaults += mp.filter(p => p.serverId === teamNum && p.outcome === 'double_fault').length;
      }
      return s;
    };

    res.json({
      player1: p1, player2: p2,
      totalMatches: matchDetails.length,
      player1Wins: p1Wins, player2Wins: p2Wins,
      stats: allPoints.length > 0 ? {
        player1: buildPlayerStats(p1),
        player2: buildPlayerStats(p2),
      } : null,
      matches: matchDetails,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
