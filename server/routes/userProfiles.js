const express = require('express')
const router = express.Router()
const prisma = require('../prisma/client')

// GET /api/user-profiles/me/:auth0Id — get current user's profile
router.get('/me/:auth0Id', async (req, res) => {
  try {
    const auth0Id = decodeURIComponent(req.params.auth0Id)
    const email = req.query.email

    // Try by auth0Id first
    let profile = await prisma.userProfile.findUnique({
      where: { auth0Id },
    })

    // Fallback: look up by email (handles multiple login methods)
    if (!profile && email) {
      profile = await prisma.userProfile.findFirst({
        where: { email },
      })
      // Link this auth0Id to the existing profile
      if (profile) {
        await prisma.userProfile.update({
          where: { id: profile.id },
          data: { auth0Id },
        })
      }
    }

    res.json(profile) // null if not registered yet
  } catch (err) {
    console.error('Failed to fetch user profile:', err.message)
    res.status(500).json({ error: 'Failed to fetch profile' })
  }
})

// POST /api/user-profiles/register — register a new player
router.post('/register', async (req, res) => {
  try {
    const {
      auth0Id, email, fullName, phone, dateOfBirth, gender, city, state,
      utrSingles, utrDoubles, ustaRating, dominantHand, playStyle, yearsPlaying,
      coachName, highSchool, graduationYear, gpa, satScore, actScore,
      intendedMajor, recruitingStatus, targetDivision, highlightVideoUrl,
    } = req.body

    if (!auth0Id || !email || !fullName) {
      return res.status(400).json({ error: 'auth0Id, email, and fullName are required' })
    }

    // Check if already registered by auth0Id or email
    const existingById = await prisma.userProfile.findUnique({ where: { auth0Id } })
    if (existingById) {
      return res.status(409).json({ error: 'User already registered', profile: existingById })
    }
    const existingByEmail = await prisma.userProfile.findFirst({ where: { email } })
    if (existingByEmail) {
      // Link this auth0Id to the existing profile
      const updated = await prisma.userProfile.update({
        where: { id: existingByEmail.id },
        data: { auth0Id },
      })
      return res.json(updated)
    }

    const profile = await prisma.userProfile.create({
      data: {
        auth0Id,
        email,
        fullName,
        phone: phone || null,
        dateOfBirth: dateOfBirth || null,
        gender: gender || null,
        city: city || null,
        state: state || null,
        utrSingles: utrSingles || null,
        utrDoubles: utrDoubles || null,
        ustaRating: ustaRating || null,
        dominantHand: dominantHand || null,
        playStyle: playStyle || null,
        yearsPlaying: yearsPlaying ? parseInt(yearsPlaying) : null,
        coachName: coachName || null,
        highSchool: highSchool || null,
        graduationYear: graduationYear ? parseInt(graduationYear) : null,
        gpa: gpa || null,
        satScore: satScore ? parseInt(satScore) : null,
        actScore: actScore ? parseInt(actScore) : null,
        intendedMajor: intendedMajor || null,
        recruitingStatus: recruitingStatus || null,
        targetDivision: targetDivision || null,
        highlightVideoUrl: highlightVideoUrl || null,
        role: 'player',
        status: 'pending',
      },
    })

    res.json(profile)
  } catch (err) {
    console.error('Failed to register user:', err.message)
    res.status(500).json({ error: 'Failed to register' })
  }
})

// PUT /api/user-profiles/:id — update own profile
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const {
      fullName, phone, dateOfBirth, gender, city, state,
      utrSingles, utrDoubles, ustaRating, dominantHand, playStyle, yearsPlaying,
      coachName, highSchool, graduationYear, gpa, satScore, actScore,
      intendedMajor, recruitingStatus, targetDivision, highlightVideoUrl,
    } = req.body

    const profile = await prisma.userProfile.update({
      where: { id },
      data: {
        fullName,
        phone: phone || null,
        dateOfBirth: dateOfBirth || null,
        gender: gender || null,
        city: city || null,
        state: state || null,
        utrSingles: utrSingles || null,
        utrDoubles: utrDoubles || null,
        ustaRating: ustaRating || null,
        dominantHand: dominantHand || null,
        playStyle: playStyle || null,
        yearsPlaying: yearsPlaying ? parseInt(yearsPlaying) : null,
        coachName: coachName || null,
        highSchool: highSchool || null,
        graduationYear: graduationYear ? parseInt(graduationYear) : null,
        gpa: gpa || null,
        satScore: satScore ? parseInt(satScore) : null,
        actScore: actScore ? parseInt(actScore) : null,
        intendedMajor: intendedMajor || null,
        recruitingStatus: recruitingStatus || null,
        targetDivision: targetDivision || null,
        highlightVideoUrl: highlightVideoUrl || null,
      },
    })

    res.json(profile)
  } catch (err) {
    console.error('Failed to update profile:', err.message)
    res.status(500).json({ error: 'Failed to update profile' })
  }
})

// ============ ADMIN ROUTES ============

// GET /api/user-profiles/admin/all — get all profiles (admin only)
router.get('/admin/all', async (req, res) => {
  try {
    const adminAuth0Id = req.query.adminAuth0Id
    if (!adminAuth0Id) {
      return res.status(400).json({ error: 'adminAuth0Id is required' })
    }

    const admin = await prisma.userProfile.findUnique({
      where: { auth0Id: decodeURIComponent(adminAuth0Id) },
    })
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized: admin access required' })
    }

    const profiles = await prisma.userProfile.findMany({
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    })
    res.json(profiles)
  } catch (err) {
    console.error('Failed to fetch all profiles:', err.message)
    res.status(500).json({ error: 'Failed to fetch profiles' })
  }
})

// PUT /api/user-profiles/admin/:id/approve — approve a registration
router.put('/admin/:id/approve', async (req, res) => {
  try {
    const adminAuth0Id = req.body.adminAuth0Id
    const admin = await prisma.userProfile.findUnique({
      where: { auth0Id: adminAuth0Id },
    })
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    const profile = await prisma.userProfile.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'approved', rejectionReason: null },
    })
    res.json(profile)
  } catch (err) {
    console.error('Failed to approve:', err.message)
    res.status(500).json({ error: 'Failed to approve' })
  }
})

// PUT /api/user-profiles/admin/:id/reject — reject a registration
router.put('/admin/:id/reject', async (req, res) => {
  try {
    const { adminAuth0Id, reason } = req.body
    const admin = await prisma.userProfile.findUnique({
      where: { auth0Id: adminAuth0Id },
    })
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    const profile = await prisma.userProfile.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'rejected', rejectionReason: reason || null },
    })
    res.json(profile)
  } catch (err) {
    console.error('Failed to reject:', err.message)
    res.status(500).json({ error: 'Failed to reject' })
  }
})

// POST /api/user-profiles/setup-admin — one-time setup to promote first user to admin
router.post('/setup-admin', async (req, res) => {
  try {
    // Check if any admin exists already
    const existingAdmin = await prisma.userProfile.findFirst({ where: { role: 'admin' } })
    if (existingAdmin) {
      return res.status(403).json({ error: 'Admin already exists. Use the admin dashboard instead.' })
    }

    const { email } = req.body
    if (!email) {
      return res.status(400).json({ error: 'email is required' })
    }

    const profile = await prisma.userProfile.updateMany({
      where: { email },
      data: { role: 'admin', status: 'approved' },
    })

    if (profile.count === 0) {
      return res.status(404).json({ error: 'No user found with that email' })
    }

    res.json({ message: 'Admin setup complete', updated: profile.count })
  } catch (err) {
    console.error('Failed to setup admin:', err.message)
    res.status(500).json({ error: 'Failed to setup admin' })
  }
})

module.exports = router
