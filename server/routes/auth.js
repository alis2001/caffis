const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/authMiddleware');
const { 
  sendEmailVerification, 
  sendSMSVerification, 
  verifyCode 
} = require('../services/verificationService');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;
const { body, validationResult } = require('express-validator');

// Helper function to validate phone number format
function isValidPhoneNumber(phone) {
  // Basic international phone number validation (starts with + and 10-15 digits)
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
}

// =======================
// Register Endpoint - Step 1: Create Account
// =======================
router.post(
  '/register',
  [
    body('firstName').notEmpty().withMessage('Nome è obbligatorio'),
    body('lastName').notEmpty().withMessage('Cognome è obbligatorio'),
    body('username').notEmpty().withMessage('Username è obbligatorio'),
    body('password')
      .isLength({ min: 8 }).withMessage('La password deve avere almeno 8 caratteri')
      .matches(/[a-z]/).withMessage('Deve includere una lettera minuscola')
      .matches(/[A-Z]/).withMessage('Deve includere una lettera maiuscola')
      .matches(/\d/).withMessage('Deve includere un numero'),
    // Custom validation for email OR phone
    body().custom((value, { req }) => {
      const { email, phoneNumber } = req.body;
      
      if (!email && !phoneNumber) {
        throw new Error('Email o numero di telefono è obbligatorio');
      }
      
      if (email && phoneNumber) {
        throw new Error('Scegli email O numero di telefono, non entrambi');
      }
      
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          throw new Error('Email non valida');
        }
      }
      
      if (phoneNumber && !isValidPhoneNumber(phoneNumber)) {
        throw new Error('Numero di telefono non valido (usa formato +39XXXXXXXXX)');
      }
      
      return true;
    })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { firstName, lastName, username, email, phoneNumber, password } = req.body;

    try {
      // Check if username is already taken
      const existingUsername = await prisma.user.findUnique({ where: { username } });
      if (existingUsername)
        return res.status(400).json({ error: 'Username già in uso' });

      // Check if email/phone already exists
      if (email) {
        const existingEmail = await prisma.user.findUnique({ where: { email } });
        if (existingEmail)
          return res.status(400).json({ error: 'Email già registrata' });
      }
      
      if (phoneNumber) {
        const existingPhone = await prisma.user.findUnique({ where: { phoneNumber } });
        if (existingPhone)
          return res.status(400).json({ error: 'Numero di telefono già registrato' });
      }

      // Hash password
      const hashed = await bcrypt.hash(password, 10);

      // Create user account (unverified)
      const user = await prisma.user.create({
        data: { 
          firstName, 
          lastName, 
          username, 
          email: email || null, 
          phoneNumber: phoneNumber || null, 
          password: hashed,
          isEmailVerified: false,
          isPhoneVerified: false
        },
      });

      // Send verification code
      if (email) {
        await sendEmailVerification(user.id, email, 'REGISTRATION', firstName);
        res.status(201).json({ 
          message: 'Account creato. Controlla la tua email per il codice di verifica.',
          userId: user.id,
          verificationType: 'email',
          contactInfo: email
        });
      } else if (phoneNumber) {
        await sendSMSVerification(user.id, phoneNumber, 'REGISTRATION');
        res.status(201).json({ 
          message: 'Account creato. Controlla i tuoi SMS per il codice di verifica.',
          userId: user.id,
          verificationType: 'phone',
          contactInfo: phoneNumber
        });
      }

    } catch (err) {
      console.error('Register Error:', err);
      res.status(500).json({ error: 'Errore del server' });
    }
  }
);

// =======================
// Verify Registration Code - Step 2: Verify Account
// =======================
router.post(
  '/verify-registration',
  [
    body('userId').notEmpty().withMessage('User ID è obbligatorio'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('Il codice deve essere di 6 cifre')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { userId, code } = req.body;

    try {
      const result = await verifyCode(userId, code, 'REGISTRATION');
      
      if (result.success) {
        // Generate JWT token for auto-login
        const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
        
        res.json({ 
          message: 'Account verificato con successo! Accesso automatico...',
          verified: true,
          token // Return token for auto-login
        });
      } else {
        res.status(400).json({ error: result.message });
      }
    } catch (err) {
      console.error('Verification Error:', err);
      res.status(500).json({ error: 'Errore del server' });
    }
  }
);

// =======================
// Resend Verification Code
// =======================
router.post(
  '/resend-verification',
  [
    body('userId').notEmpty().withMessage('User ID è obbligatorio')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { userId } = req.body;

    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user)
        return res.status(404).json({ error: 'Utente non trovato' });

      if (user.isEmailVerified && user.isPhoneVerified)
        return res.status(400).json({ error: 'Account già verificato' });

      // Resend verification
      if (user.email && !user.isEmailVerified) {
        await sendEmailVerification(user.id, user.email, 'REGISTRATION', user.firstName);
        res.json({ message: 'Codice di verifica inviato via email' });
      } else if (user.phoneNumber && !user.isPhoneVerified) {
        await sendSMSVerification(user.id, user.phoneNumber, 'REGISTRATION');
        res.json({ message: 'Codice di verifica inviato via SMS' });
      } else {
        res.status(400).json({ error: 'Nessun contatto da verificare' });
      }

    } catch (err) {
      console.error('Resend Error:', err);
      res.status(500).json({ error: 'Errore del server' });
    }
  }
);

// =======================
// Login Endpoint - Step 1: Request Login Code
// =======================
router.post(
  '/login',
  [
    body('emailOrUsername').notEmpty().withMessage('Email, numero di telefono o username è obbligatorio'),
    body('password').notEmpty().withMessage('Password è obbligatoria')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { emailOrUsername, password } = req.body;

    try {
      // Find user by email, phone, or username
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: emailOrUsername },
            { phoneNumber: emailOrUsername },
            { username: emailOrUsername }
          ]
        }
      });

      if (!user)
        return res.status(401).json({ error: 'Credenziali non valide' });

      // Check if account is verified
      if (!user.isEmailVerified && !user.isPhoneVerified)
        return res.status(401).json({ 
          error: 'Account non verificato. Completa prima la registrazione.',
          needsVerification: true,
          userId: user.id
        });

      // Verify password
      const valid = await bcrypt.compare(password, user.password);
      if (!valid)
        return res.status(401).json({ error: 'Credenziali non valide' });

      // Send login verification code
      if (user.email && user.isEmailVerified) {
        await sendEmailVerification(user.id, user.email, 'LOGIN', user.firstName);
        res.json({ 
          message: 'Codice di accesso inviato via email',
          userId: user.id,
          verificationType: 'email',
          contactInfo: user.email.replace(/(.{3}).+(@.+)/, '$1***$2') // Mask email
        });
      } else if (user.phoneNumber && user.isPhoneVerified) {
        await sendSMSVerification(user.id, user.phoneNumber, 'LOGIN');
        const maskedPhone = user.phoneNumber.replace(/(.{4}).+(.{3})/, '$1***$2'); // Mask phone
        res.json({ 
          message: 'Codice di accesso inviato via SMS',
          userId: user.id,
          verificationType: 'phone',
          contactInfo: maskedPhone
        });
      } else {
        res.status(400).json({ error: 'Nessun metodo di verifica disponibile' });
      }

    } catch (err) {
      console.error('Login Error:', err);
      res.status(500).json({ error: 'Errore del server' });
    }
  }
);

// =======================
// Verify Login Code - Step 2: Complete Login
// =======================
router.post(
  '/verify-login',
  [
    body('userId').notEmpty().withMessage('User ID è obbligatorio'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('Il codice deve essere di 6 cifre')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { userId, code } = req.body;

    try {
      const result = await verifyCode(userId, code, 'LOGIN');
      
      if (result.success) {
        // Generate JWT token
        const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
        
        res.json({ 
          message: 'Accesso completato con successo',
          token,
          verified: true 
        });
      } else {
        res.status(400).json({ error: result.message });
      }
    } catch (err) {
      console.error('Login Verification Error:', err);
      res.status(500).json({ error: 'Errore del server' });
    }
  }
);

// =======================
// Get Current User (with onboarding status)
// =======================
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true,
        phoneNumber: true,
        bio: true,
        profilePic: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        onboardingCompleted: true, // Include onboarding status
        createdAt: true
      }
    });

    if (!user) return res.status(404).json({ error: 'Utente non trovato' });

    res.json(user);
  } catch (err) {
    console.error('Me Error:', err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

module.exports = router;