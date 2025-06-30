const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/authMiddleware');

const prisma = new PrismaClient();
const router = express.Router();

// Accept a request
router.post('/:id/accept', authMiddleware, async (req, res) => {
  const requestId = req.params.id;

  try {
    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: { invite: true }
    });

    if (!request) return res.status(404).json({ error: 'Request not found' });

    if (request.invite.hostId !== req.user.id)
      return res.status(403).json({ error: 'Not authorized to manage this request' });

    const updated = await prisma.request.update({
      where: { id: requestId },
      data: { status: 'accepted' }
    });

    res.json({ message: 'Request accepted', request: updated });
  } catch (err) {
    console.error('Accept Request Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reject a request
router.post('/:id/reject', authMiddleware, async (req, res) => {
  const requestId = req.params.id;

  try {
    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: { invite: true }
    });

    if (!request) return res.status(404).json({ error: 'Request not found' });

    if (request.invite.hostId !== req.user.id)
      return res.status(403).json({ error: 'Not authorized to manage this request' });

    const updated = await prisma.request.update({
      where: { id: requestId },
      data: { status: 'rejected' }
    });

    res.json({ message: 'Request rejected', request: updated });
  } catch (err) {
    console.error('Reject Request Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
