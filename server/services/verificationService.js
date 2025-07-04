// server/services/verificationService.js
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Email transporter setup
const emailTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Twilio client setup (optional - only if real credentials provided)
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && 
    process.env.TWILIO_AUTH_TOKEN && 
    process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
  twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
}

// Generate a 6-digit verification code
function generateVerificationCode() {
  return crypto.randomInt(100000, 999999).toString();
}

// Calculate expiry time
function calculateExpiryTime() {
  const minutes = parseInt(process.env.VERIFICATION_CODE_EXPIRY_MINUTES) || 5;
  return new Date(Date.now() + minutes * 60 * 1000);
}

/**
 * Send verification code via email
 * @param {string} userId - User ID
 * @param {string} email - Email address
 * @param {string} purpose - Verification purpose (REGISTRATION, LOGIN, etc.)
 * @param {string} userName - User's first name for personalization
 */
async function sendEmailVerification(userId, email, purpose, userName = '') {
  try {
    // Generate verification code
    const code = generateVerificationCode();
    const expiresAt = calculateExpiryTime();

    // Save to database
    await prisma.verificationCode.create({
      data: {
        code,
        type: 'EMAIL',
        purpose,
        userId,
        expiresAt,
      },
    });

    // Prepare email content based on purpose
    let subject, htmlContent;
    
    if (purpose === 'REGISTRATION') {
      subject = '✅ Conferma il tuo account Caffis';
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #6BBF59, #FF6B6B); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">☕ Caffis</h1>
            <p style="color: white; margin: 5px 0 0 0;">Connettiti con un caffè</p>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333;">Ciao ${userName}! 👋</h2>
            <p style="color: #666; font-size: 16px;">
              Benvenuto in Caffis! Per completare la registrazione, inserisci questo codice:
            </p>
            
            <div style="background: white; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
              <h1 style="color: #6BBF59; font-size: 32px; letter-spacing: 3px; margin: 0;">${code}</h1>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Il codice scade tra ${process.env.VERIFICATION_CODE_EXPIRY_MINUTES || 5} minuti.
            </p>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              Se non hai richiesto questo codice, ignora questa email.
            </p>
          </div>
        </div>
      `;
    } else if (purpose === 'LOGIN') {
      subject = '🔐 Codice di accesso Caffis';
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #6BBF59, #FF6B6B); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">☕ Caffis</h1>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333;">Codice di accesso</h2>
            <p style="color: #666; font-size: 16px;">
              Ecco il tuo codice per accedere a Caffis:
            </p>
            
            <div style="background: white; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
              <h1 style="color: #6BBF59; font-size: 32px; letter-spacing: 3px; margin: 0;">${code}</h1>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Il codice scade tra ${process.env.VERIFICATION_CODE_EXPIRY_MINUTES || 5} minuti.
            </p>
          </div>
        </div>
      `;
    }

    // Send email
    await emailTransporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject,
      html: htmlContent,
    });

    return { success: true, message: 'Email inviata con successo' };
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Errore nell\'invio dell\'email');
  }
}

/**
 * Send verification code via SMS
 * @param {string} userId - User ID
 * @param {string} phoneNumber - Phone number (with country code)
 * @param {string} purpose - Verification purpose
 */
async function sendSMSVerification(userId, phoneNumber, purpose) {
  try {
    // Check if Twilio is configured
    if (!twilioClient) {
      throw new Error('SMS service not configured. Please set up Twilio credentials.');
    }

    // Generate verification code
    const code = generateVerificationCode();
    const expiresAt = calculateExpiryTime();

    // Save to database
    await prisma.verificationCode.create({
      data: {
        code,
        type: 'SMS',
        purpose,
        userId,
        expiresAt,
      },
    });

    // Prepare SMS content based on purpose
    let message;
    if (purpose === 'REGISTRATION') {
      message = `☕ Caffis: Il tuo codice di verifica è ${code}. Scade tra ${process.env.VERIFICATION_CODE_EXPIRY_MINUTES || 5} minuti.`;
    } else if (purpose === 'LOGIN') {
      message = `☕ Caffis: Codice di accesso: ${code}. Scade tra ${process.env.VERIFICATION_CODE_EXPIRY_MINUTES || 5} minuti.`;
    }

    // Send SMS via Twilio
    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    return { success: true, message: 'SMS inviato con successo' };
  } catch (error) {
    console.error('SMS sending error:', error);
    throw new Error('Errore nell\'invio dell\'SMS');
  }
}

/**
 * Verify a verification code
 * @param {string} userId - User ID
 * @param {string} code - Verification code to check
 * @param {string} purpose - Verification purpose
 */
async function verifyCode(userId, code, purpose) {
  try {
    console.log(`[VERIFY] Attempting to verify code for user: ${userId}, purpose: ${purpose}, code: ${code}`);
    
    // Find the most recent unverified code for this user and purpose
    const verificationRecord = await prisma.verificationCode.findFirst({
      where: {
        userId,
        purpose,
        verified: false,
        expiresAt: {
          gt: new Date(), // Not expired
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`[VERIFY] Found verification record:`, verificationRecord);

    if (!verificationRecord) {
      console.log(`[VERIFY] No valid verification record found`);
      return { success: false, message: 'Codice non valido o scaduto' };
    }

    // Check if max attempts exceeded
    const maxAttempts = parseInt(process.env.MAX_VERIFICATION_ATTEMPTS) || 3;
    if (verificationRecord.attempts >= maxAttempts) {
      console.log(`[VERIFY] Max attempts exceeded: ${verificationRecord.attempts}/${maxAttempts}`);
      return { success: false, message: 'Troppi tentativi. Richiedi un nuovo codice.' };
    }

    // Increment attempts
    await prisma.verificationCode.update({
      where: { id: verificationRecord.id },
      data: { attempts: verificationRecord.attempts + 1 },
    });

    console.log(`[VERIFY] Comparing codes: received="${code}", stored="${verificationRecord.code}"`);

    // Check if code matches
    if (verificationRecord.code !== code) {
      console.log(`[VERIFY] Code mismatch!`);
      return { success: false, message: 'Codice non corretto' };
    }

    // Mark as verified
    await prisma.verificationCode.update({
      where: { id: verificationRecord.id },
      data: { verified: true },
    });

    console.log(`[VERIFY] Code verified successfully!`);

    // Update user verification status
    if (verificationRecord.type === 'EMAIL') {
      await prisma.user.update({
        where: { id: userId },
        data: { isEmailVerified: true },
      });
    } else if (verificationRecord.type === 'SMS') {
      await prisma.user.update({
        where: { id: userId },
        data: { isPhoneVerified: true },
      });
    }

    return { success: true, message: 'Codice verificato con successo' };
  } catch (error) {
    console.error('[VERIFY] Code verification error:', error);
    throw new Error('Errore nella verifica del codice');
  }
}

/**
 * Clean up expired verification codes (run periodically)
 */
async function cleanupExpiredCodes() {
  try {
    const result = await prisma.verificationCode.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    console.log(`Cleaned up ${result.count} expired verification codes`);
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

module.exports = {
  sendEmailVerification,
  sendSMSVerification,
  verifyCode,
  cleanupExpiredCodes,
};