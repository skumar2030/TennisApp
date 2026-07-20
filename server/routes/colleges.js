const express = require('express')
const router = express.Router()
const multer = require('multer')
const XLSX = require('xlsx')
const prisma = require('../prisma/client')

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

// GET /api/colleges/template/download — download Excel template
router.get('/template/download', (req, res) => {
  const headers = [
    'College Name', 'Division', 'Choice Rank', 'Program Ranking',
    'Acceptance Rate %', 'Required GPA', 'Required SAT', 'Required ACT',
    'UTR Requirement', 'Tuition Annual $', 'Scholarship %',
    'Coach Name', 'Coach Email', 'Notes',
  ]
  const sampleRow = [
    'Stanford University', 'D1', 1, 5,
    4.3, 3.9, 1500, 34,
    '12-14', 58195, 50,
    'John Smith', 'jsmith@stanford.edu', 'Top choice',
  ]

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow])

  const colWidths = headers.map(h => ({ wch: Math.max(h.length + 2, 15) }))
  ws['!cols'] = colWidths

  XLSX.utils.book_append_sheet(wb, ws, 'College List')
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  res.setHeader('Content-Disposition', 'attachment; filename=college_list_template.xlsx')
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.send(buf)
})

// POST /api/colleges/import — bulk import from Excel
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    const { userId } = req.body
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' })
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const wb = XLSX.read(req.file.buffer, { type: 'buffer' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(ws)

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Spreadsheet is empty' })
    }

    const COLUMN_MAP = {
      'college name': 'collegeName',
      'collegename': 'collegeName',
      'name': 'collegeName',
      'school': 'collegeName',
      'university': 'collegeName',
      'division': 'division',
      'div': 'division',
      'choice rank': 'choiceRank',
      'choicerank': 'choiceRank',
      'rank': 'choiceRank',
      'my rank': 'choiceRank',
      'program ranking': 'programRanking',
      'programranking': 'programRanking',
      'program rank': 'programRanking',
      'acceptance rate': 'acceptanceRate',
      'acceptance rate %': 'acceptanceRate',
      'acceptancerate': 'acceptanceRate',
      'accept rate': 'acceptanceRate',
      'required gpa': 'requiredGPA',
      'requiredgpa': 'requiredGPA',
      'gpa': 'requiredGPA',
      'required sat': 'requiredSAT',
      'requiredsat': 'requiredSAT',
      'sat': 'requiredSAT',
      'sat score': 'requiredSAT',
      'required act': 'requiredACT',
      'requiredact': 'requiredACT',
      'act': 'requiredACT',
      'act score': 'requiredACT',
      'utr requirement': 'utrRequirement',
      'utrrequirement': 'utrRequirement',
      'utr': 'utrRequirement',
      'utr target': 'utrRequirement',
      'tuition annual': 'tuitionAnnual',
      'tuition annual $': 'tuitionAnnual',
      'tuitionannual': 'tuitionAnnual',
      'tuition': 'tuitionAnnual',
      'tuition/year': 'tuitionAnnual',
      'scholarship %': 'scholarshipPct',
      'scholarship': 'scholarshipPct',
      'scholarshippct': 'scholarshipPct',
      'coach name': 'coachName',
      'coachname': 'coachName',
      'coach': 'coachName',
      'coach email': 'coachEmail',
      'coachemail': 'coachEmail',
      'notes': 'notes',
    }

    const mapRow = (row) => {
      const mapped = {}
      for (const [key, value] of Object.entries(row)) {
        const normalized = key.toLowerCase().trim()
        const field = COLUMN_MAP[normalized]
        if (field) mapped[field] = value
      }
      return mapped
    }

    const validDivisions = ['D1', 'D2', 'D3', 'NAIA', 'JUCO']
    const imported = []
    const errors = []

    for (let i = 0; i < rows.length; i++) {
      const mapped = mapRow(rows[i])
      const rowNum = i + 2

      if (!mapped.collegeName) {
        errors.push(`Row ${rowNum}: Missing college name — skipped`)
        continue
      }

      let division = String(mapped.division || 'D1').toUpperCase().trim()
      if (!validDivisions.includes(division)) {
        errors.push(`Row ${rowNum}: Invalid division "${division}", defaulting to D1`)
        division = 'D1'
      }

      imported.push({
        userId,
        collegeName: String(mapped.collegeName).trim(),
        division,
        choiceRank: mapped.choiceRank ? parseInt(mapped.choiceRank) || 0 : 0,
        programRanking: mapped.programRanking ? parseInt(mapped.programRanking) || null : null,
        acceptanceRate: mapped.acceptanceRate ? parseFloat(mapped.acceptanceRate) || null : null,
        requiredGPA: mapped.requiredGPA ? parseFloat(mapped.requiredGPA) || null : null,
        requiredSAT: mapped.requiredSAT ? parseInt(mapped.requiredSAT) || null : null,
        requiredACT: mapped.requiredACT ? parseInt(mapped.requiredACT) || null : null,
        utrRequirement: mapped.utrRequirement ? String(mapped.utrRequirement) : null,
        tuitionAnnual: mapped.tuitionAnnual ? parseInt(String(mapped.tuitionAnnual).replace(/[,$]/g, '')) || null : null,
        scholarshipPct: mapped.scholarshipPct ? parseFloat(mapped.scholarshipPct) || null : null,
        coachName: mapped.coachName ? String(mapped.coachName) : null,
        coachEmail: mapped.coachEmail ? String(mapped.coachEmail) : null,
        notes: mapped.notes ? String(mapped.notes) : null,
        applicationStatus: 'not_started',
        interviewStatus: 'not_scheduled',
        campusVisit: 'not_planned',
        transcriptReady: false,
        recsRequested: 0,
        recsReceived: 0,
      })
    }

    if (imported.length === 0) {
      return res.status(400).json({ error: 'No valid rows found', errors })
    }

    const result = await prisma.collegeList.createMany({ data: imported })

    res.json({
      message: `Successfully imported ${result.count} college${result.count !== 1 ? 's' : ''}`,
      imported: result.count,
      errors,
    })
  } catch (err) {
    console.error('Failed to import colleges:', err.message)
    res.status(500).json({ error: 'Failed to import file' })
  }
})

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
