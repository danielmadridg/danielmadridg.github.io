"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyCode = exports.sendVerificationCode = exports.verifyRecaptcha = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios_1 = require("axios");
const nodemailer = require("nodemailer");
// Initialize Firebase Admin
admin.initializeApp();
// Access the secret key from environment variables
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY || '6LeI5BwsAAAAAFWR_dtUnzfIpXNHU0RtY4i8J1Dq';
// Configure email transporter using Firebase's SMTP
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'noreply@prodegitracker.com',
        pass: process.env.EMAIL_PASSWORD || '', // Set via: firebase functions:config:set email.password="YOUR_APP_PASSWORD"
    },
});
// Generate a 6-digit code
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
exports.verifyRecaptcha = functions.https.onCall(async (data, context) => {
    const { token } = data;
    if (!token) {
        return { success: false, error: 'Token is missing' };
    }
    try {
        const response = await axios_1.default.post(`https://www.google.com/recaptcha/api/siteverify`, null, {
            params: {
                secret: RECAPTCHA_SECRET_KEY,
                response: token,
            },
        });
        const { success, score, action, 'error-codes': errorCodes } = response.data;
        console.log('reCAPTCHA response:', JSON.stringify(response.data));
        if (success && score && score > 0.5) {
            return { success: true, score, action };
        }
        else {
            console.warn(`reCAPTCHA failed: score=${score}, errors=${JSON.stringify(errorCodes)}`);
            return { success: false, score, action, error: 'Bot detected or verification failed', errorCodes };
        }
    }
    catch (error) {
        console.error('reCAPTCHA verification failed:', error);
        return { success: false, error: 'Verification failed' };
    }
});
// Send verification code via email
exports.sendVerificationCode = functions.https.onCall(async (data, context) => {
    const { email, name } = data;
    if (!email) {
        return { success: false, error: 'Email is required' };
    }
    try {
        // Generate 6-digit code
        const code = generateVerificationCode();
        // Store code in Firestore with 10-minute expiration
        const db = admin.firestore();
        await db.collection('verificationCodes').doc(email).set({
            code,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 10 * 60 * 1000), // 10 minutes
            attempts: 0,
        });
        // Send email
        const mailOptions = {
            from: '"Prodegi" <noreply@prodegitracker.com>',
            to: email,
            subject: 'Your Verification Code - Prodegi',
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Arial', sans-serif; background-color: #0a0a0a; color: #ffffff; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background-color: #141414; border-radius: 16px; padding: 40px; border: 1px solid #1a1a1a; }
            .logo { text-align: center; font-size: 32px; font-weight: 700; color: #C8956B; margin-bottom: 30px; letter-spacing: 1px; }
            .code-box { background-color: #1a1a1a; border: 2px solid #C8956B; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; }
            .code { font-size: 48px; font-weight: 700; color: #C8956B; letter-spacing: 8px; font-family: 'Courier New', monospace; }
            .message { font-size: 16px; line-height: 1.6; color: #cccccc; margin: 20px 0; }
            .footer { text-align: center; font-size: 14px; color: #6a6a6a; margin-top: 40px; padding-top: 20px; border-top: 1px solid #1a1a1a; }
            .warning { background-color: rgba(207, 102, 121, 0.1); border-left: 4px solid #cf6679; padding: 15px; margin: 20px 0; border-radius: 4px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">PRODEGI</div>
            <div class="message">
              Hello ${name || 'there'},<br><br>
              Welcome to Prodegi! To complete your registration, please use the following verification code:
            </div>
            <div class="code-box">
              <div class="code">${code}</div>
            </div>
            <div class="message">
              This code will expire in <strong>10 minutes</strong>.
            </div>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong> Never share this code with anyone. Prodegi staff will never ask for your verification code.
            </div>
            <div class="footer">
              If you didn't request this code, you can safely ignore this email.<br><br>
              © 2025 Prodegi. All rights reserved.<br>
              <a href="mailto:contact@prodegitracker.com" style="color: #C8956B; text-decoration: none;">contact@prodegitracker.com</a>
            </div>
          </div>
        </body>
        </html>
      `,
        };
        await transporter.sendMail(mailOptions);
        console.log(`Verification code sent to ${email}`);
        return { success: true };
    }
    catch (error) {
        console.error('Error sending verification code:', error);
        return { success: false, error: 'Failed to send verification code' };
    }
});
// Verify the code entered by user
exports.verifyCode = functions.https.onCall(async (data, context) => {
    const { email, code } = data;
    if (!email || !code) {
        return { success: false, error: 'Email and code are required' };
    }
    try {
        const db = admin.firestore();
        const docRef = db.collection('verificationCodes').doc(email);
        const doc = await docRef.get();
        if (!doc.exists) {
            return { success: false, error: 'No verification code found' };
        }
        const data = doc.data();
        if (!data) {
            return { success: false, error: 'Invalid verification data' };
        }
        // Check if code has expired
        const now = admin.firestore.Timestamp.now();
        if (data.expiresAt < now) {
            await docRef.delete();
            return { success: false, error: 'Verification code has expired' };
        }
        // Check attempts (max 5)
        if (data.attempts >= 5) {
            await docRef.delete();
            return { success: false, error: 'Too many failed attempts' };
        }
        // Verify code
        if (data.code === code) {
            // Code is correct, delete it
            await docRef.delete();
            return { success: true };
        }
        else {
            // Increment attempts
            await docRef.update({
                attempts: admin.firestore.FieldValue.increment(1),
            });
            return { success: false, error: 'Invalid verification code' };
        }
    }
    catch (error) {
        console.error('Error verifying code:', error);
        return { success: false, error: 'Verification failed' };
    }
});
//# sourceMappingURL=index.js.map