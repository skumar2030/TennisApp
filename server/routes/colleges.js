const express = require('express')
const router = express.Router()
const prisma = require('../prisma/client')

// GET /api/colleges/:userId — get all colleges for a user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    const colleges = await prisma.collegeList.findMany({
      where: { userId: decodeURIComponent(userId) },
      orderBy: { choiceRank: 'asc' },
    })
    res.json(colleges)
  } catch (err) {
    console.error('Failed to fetch colleges:', err.message)
    res.status(500).json({ error: 'Failed to fetch college list' })
  }
})

// POST /api/colleges — add a college
router.post('/', async (req, res) => {
  try {
    const {
      userId, collegeName, division, programRanking, acceptanceRate,
      requiredGPA, requiredSAT, requiredACT, utrRequirement,
      tuitionAnnual, scholarshipPct, choiceRank, applicationStatus,
      interviewStatus, coachName, coachEmail, campusVisit, visitDate,
      highlightVideo, transcriptReady, recsRequested, recsReceived, notes,
    } = req.body

    if (!userId || !collegeName || !division) {
      return res.status(400).json({ error: 'userId, collegeName, and division are required' })
    }

    const college = await prisma.collegeList.create({
      data: {
        userId,
        collegeName,
        division,
        programRanking: programRanking ? parseInt(programRanking) : null,
        acceptanceRate: acceptanceRate ? parseFloat(acceptanceRate) : null,
        requiredGPA: requiredGPA ? parseFloat(requiredGPA) : null,
        requiredSAT: requiredSAT ? parseInt(requiredSAT) : null,
        requiredACT: requiredACT ? parseInt(requiredACT) : null,
        utrRequirement: utrRequirement || null,
        tuitionAnnual: tuitionAnnual ? parseInt(tuitionAnnual) : null,
        scholarshipPct: scholarshipPct ? parseFloat(scholarshipPct) : null,
        choiceRank: choiceRank ? parseInt(choiceRank) : 0,
        applicationStatus: applicationStatus || 'not_started',
        interviewStatus: interviewStatus || 'not_scheduled',
        coachName: coachName || null,
        coachEmail: coachEmail || null,
        campusVisit: campusVisit || 'not_planned',
        visitDate: visitDate ? new Date(visitDate) : null,
        highlightVideo: highlightVideo || null,
        transcriptReady: transcriptReady || false,
        recsRequested: recsRequested ? parseInt(recsRequested) : 0,
        recsReceived: recsReceived ? parseInt(recsReceived) : 0,
        notes: notes || null,
      },
    })

    res.json(college)
  } catch (err) {
    console.error('Failed to create college:', err.message)
    res.status(500).json({ error: 'Failed to add college' })
  }
})

// PUT /api/colleges/:id — update a college
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const {
      collegeName, division, programRanking, acceptanceRate,
      requiredGPA, requiredSAT, requiredACT, utrRequirement,
      tuitionAnnual, scholarshipPct, choiceRank, applicationStatus,
      interviewStatus, coachName, coachEmail, campusVisit, visitDate,
      highlightVideo, transcriptReady, recsRequested, recsReceived, notes,
    } = req.body

    const college = await prisma.collegeList.update({
      where: { id },
      data: {
        collegeName,
        division,
        programRanking: programRanking ? parseInt(programRanking) : null,
        acceptanceRate: acceptanceRate ? parseFloat(acceptanceRate) : null,
        requiredGPA: requiredGPA ? parseFloat(requiredGPA) : null,
        requiredSAT: requiredSAT ? parseInt(requiredSAT) : null,
        requiredACT: requiredACT ? parseInt(requiredACT) : null,
        utrRequirement: utrRequirement || null,
        tuitionAnnual: tuitionAnnual ? parseInt(tuitionAnnual) : null,
        scholarshipPct: scholarshipPct ? parseFloat(scholarshipPct) : null,
        choiceRank: choiceRank ? parseInt(choiceRank) : 0,
        applicationStatus: applicationStatus || 'not_started',
        interviewStatus: interviewStatus || 'not_scheduled',
        coachName: coachName || null,
        coachEmail: coachEmail || null,
        campusVisit: campusVisit || 'not_planned',
        visitDate: visitDate ? new Date(visitDate) : null,
        highlightVideo: highlightVideo || null,
        transcriptReady: transcriptReady === true || transcriptReady === 'true',
        recsRequested: recsRequested ? parseInt(recsRequested) : 0,
        recsReceived: recsReceived ? parseInt(recsReceived) : 0,
        notes: notes || null,
      },
    })

    res.json(college)
  } catch (err) {
    console.error('Failed to update college:', err.message)
    res.status(500).json({ error: 'Failed to update college' })
  }
})

// DELETE /api/colleges/:id — remove a college
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    await prisma.collegeList.delete({ where: { id } })
    res.json({ message: 'Deleted' })
  } catch (err) {
    console.error('Failed to delete college:', err.message)
    res.status(500).json({ error: 'Failed to delete college' })
  }
})

module.exports = router
