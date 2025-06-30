const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/authMiddleware');
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;
const { body, validationResult } = require('express-validator');

// =======================
// Register Endpoint
// =======================
router.post(
  '/register',
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/[a-z]/).withMessage('Must include lowercase')
      .matches(/[A-Z]/).withMessage('Must include uppercase')
      .matches(/\d/).withMessage('Must include a number')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { firstName, lastName, username, email, password } = req.body;

    try {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing)
        return res.status(400).json({ error: 'Email already in use' });

      const hashed = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: { firstName, lastName, username, email, password: hashed },
      });

      res.status(201).json({ message: 'User created', user });
    } catch (err) {
      console.error('Register Error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// =======================
// Login Endpoint
// =======================
router.post(
  '/login',
  [
    body('emailOrUsername').notEmpty().withMessage('Email or username is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { emailOrUsername, password } = req.body;

    try {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: emailOrUsername },
            { username: emailOrUsername }
          ]
        }
      });

      if (!user)
        return res.status(401).json({ error: 'Invalid credentials' });

      const valid = await bcrypt.compare(password, user.password);
      if (!valid)
        return res.status(401).json({ error: 'Invalid credentials' });

      const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

      res.json({ message: 'Login successful', token });
    } catch (err) {
      console.error('Login Error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);


// =======================
// Get Current User
// =======================
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        bio: true,
        profilePic: true,
        createdAt: true
      }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json(user);
  } catch (err) {
    console.error('Me Error:', err);
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
