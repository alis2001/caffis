const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');

const prisma = new PrismaClient();
const router = express.Router();

// ==========================
// Salva Preferenze Onboarding
// ==========================
router.post(
  '/preferences',
  authMiddleware,
  [
    body('ageRange').optional().isString().withMessage('Fascia età deve essere una stringa'),
    body('coffeePersonality').optional().isString().withMessage('Personalità caffè deve essere una stringa'),
    body('socialEnergy').optional().isString().withMessage('Energia sociale deve essere una stringa'),
    body('conversationTopics').optional().isString().withMessage('Argomenti conversazione deve essere una stringa'),
    body('groupPreference').optional().isString().withMessage('Preferenza gruppo deve essere una stringa'),
    body('locationPreference').optional().isString().withMessage('Preferenza location deve essere una stringa'),
    body('timePreference').optional().isString().withMessage('Preferenza orario deve essere una stringa'),
    body('socialGoals').optional().isString().withMessage('Obiettivi sociali deve essere una stringa'),
    body('meetingFrequency').optional().isString().withMessage('Frequenza incontri deve essere una stringa')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const {
      coffeePersonality,
      socialStyle,
      groupPreference,
      conversationTopics,
      meetingFrequency,
      locationPreference,
      timePreference,
      socialGoals,
      completed
    } = req.body;

    try {
      // Aggiorna le preferenze dell'utente
      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          // Aggiungiamo i nuovi campi alle preferenze
          coffeePersonality,
          socialStyle,
          groupPreference,
          conversationTopics,
          meetingFrequency,
          locationPreference,
          timePreference,
          socialGoals,
          onboardingCompleted: completed || true,
          updatedAt: new Date()
        }
      });

      // Crea anche un record di preferenze separato per analytics
      await prisma.userPreferences.create({
        data: {
          userId: req.user.id,
          preferences: {
            coffeePersonality,
            socialStyle,
            groupPreference,
            conversationTopics,
            meetingFrequency,
            locationPreference,
            timePreference,
            socialGoals
          },
          completedAt: new Date()
        }
      });

      res.json({ 
        message: 'Preferenze salvate con successo!',
        success: true,
        user: {
          id: updatedUser.id,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          onboardingCompleted: updatedUser.onboardingCompleted
        }
      });

    } catch (err) {
      console.error('Errore salvataggio preferenze:', err);
      res.status(500).json({ error: 'Errore del server durante il salvataggio' });
    }
  }
);

// ==========================
// Ottieni Preferenze Utente
// ==========================
router.get('/preferences', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        ageRange: true,
        coffeePersonality: true,
        socialEnergy: true,
        conversationTopics: true,
        groupPreference: true,
        locationPreference: true,
        timePreference: true,
        socialGoals: true,
        meetingFrequency: true,
        onboardingCompleted: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }

    res.json({
      success: true,
      preferences: user
    });

  } catch (err) {
    console.error('Errore recupero preferenze:', err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

// ==========================
// Aggiorna Singola Preferenza
// ==========================
router.patch(
  '/preferences/:field',
  authMiddleware,
  [
    body('value').notEmpty().withMessage('Valore è obbligatorio')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { field } = req.params;
    const { value } = req.body;

    // Campi consentiti per la modifica
    const allowedFields = [
      'ageRange',
      'coffeePersonality',
      'socialEnergy', 
      'conversationTopics',
      'groupPreference',
      'locationPreference',
      'timePreference',
      'socialGoals',
      'meetingFrequency'
    ];

    if (!allowedFields.includes(field)) {
      return res.status(400).json({ error: 'Campo non valido per la modifica' });
    }

    try {
      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          [field]: value,
          updatedAt: new Date()
        }
      });

      res.json({
        message: 'Preferenza aggiornata con successo!',
        success: true,
        field,
        value
      });

    } catch (err) {
      console.error('Errore aggiornamento preferenza:', err);
      res.status(500).json({ error: 'Errore del server' });
    }
  }
);

// ==========================
// Ottieni Profilo Completo Utente
// ==========================
router.get('/profile', authMiddleware, async (req, res) => {
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
        onboardingCompleted: true,
        ageRange: true,
        coffeePersonality: true,
        socialEnergy: true,
        conversationTopics: true,
        groupPreference: true,
        locationPreference: true,
        timePreference: true,
        socialGoals: true,
        meetingFrequency: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }

    res.json({
      success: true,
      user
    });

  } catch (err) {
    console.error('Errore recupero profilo:', err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

// ==========================
// Aggiorna Profilo Utente
// ==========================
router.patch(
  '/profile',
  authMiddleware,
  [
    body('firstName').optional().isLength({ min: 2 }).withMessage('Nome deve avere almeno 2 caratteri'),
    body('lastName').optional().isLength({ min: 2 }).withMessage('Cognome deve avere almeno 2 caratteri'),
    body('bio').optional().isLength({ max: 500 }).withMessage('Bio non può superare 500 caratteri'),
    body('username').optional().isLength({ min: 3 }).withMessage('Username deve avere almeno 3 caratteri')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { firstName, lastName, bio, username } = req.body;

    try {
      // Controlla se username è già in uso (se fornito)
      if (username) {
        const existingUser = await prisma.user.findFirst({
          where: {
            username,
            NOT: { id: req.user.id }
          }
        });
        
        if (existingUser) {
          return res.status(400).json({ error: 'Username già in uso' });
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(bio !== undefined && { bio }),
          ...(username && { username }),
          updatedAt: new Date()
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          bio: true,
          updatedAt: true
        }
      });

      res.json({
        message: 'Profilo aggiornato con successo!',
        success: true,
        user: updatedUser
      });

    } catch (err) {
      console.error('Errore aggiornamento profilo:', err);
      res.status(500).json({ error: 'Errore del server' });
    }
  }
);

// ==========================
// Statistiche Onboarding (per analytics)
// ==========================
router.get('/onboarding-stats', authMiddleware, async (req, res) => {
  try {
    // Solo admin o per sviluppo
    const stats = await prisma.userPreferences.groupBy({
      by: ['preferences'],
      _count: {
        id: true
      }
    });

    res.json({
      success: true,
      message: 'Statistiche onboarding',
      stats
    });

  } catch (err) {
    console.error('Errore statistiche:', err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

module.exports = router;