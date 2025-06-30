// server/routes/inviteRoutes.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');

const prisma = new PrismaClient();
const router = express.Router();

// ==========================
// Create a New Invite
// ==========================
router.post(
  '/',
  authMiddleware,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('time').isISO8601().withMessage('Time must be a valid ISO8601 date').toDate(),
    body('location').notEmpty().withMessage('Location is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { title, description, time, location } = req.body;

    try {
      const invite = await prisma.invite.create({
        data: {
          title,
          description,
          time,
          location,
          open: true,
          hostId: req.user.id
        }
      });

      res.status(201).json({ message: 'Invite created', invite });
    } catch (err) {
      console.error('Create Invite Error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// ==========================
// Get All Open Invites
// ==========================
router.get('/', async (req, res) => {
  try {
    const invites = await prisma.invite.findMany({
      where: { open: true },
      orderBy: { createdAt: 'desc' },
      include: {
        host: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        }
      }
    });

    res.json(invites);
  } catch (err) {
    console.error('Fetch Invites Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================
// Request to Join an Invite
// ==========================
router.post('/:id/request', authMiddleware, async (req, res) => {
  const inviteId = req.params.id;

  try {
    const existing = await prisma.request.findFirst({
      where: { inviteId, userId: req.user.id }
    });

    if (existing)
      return res.status(400).json({ error: 'Already requested this invite' });

    const request = await prisma.request.create({
      data: {
        inviteId,
        userId: req.user.id,
        status: 'pending'
      }
    });

    res.status(201).json({ message: 'Request sent', request });
  } catch (err) {
    console.error('Request Invite Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});



// Get invites where current user is the host
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const invites = await prisma.invite.findMany({
      where: { hostId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        requests: {
          select: {
            id: true,
            status: true,
            user: { select: { id: true, username: true, firstName: true, lastName: true } }
          }
        }
      }
    });

    res.json(invites);
  } catch (err) {
    console.error('Fetch My Invites Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
