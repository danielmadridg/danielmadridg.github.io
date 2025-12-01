"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCustomToken = exports.findUserByAccessKey = exports.checkUsernameAvailability = exports.verifyCode = exports.sendVerificationCode = exports.verifyRecaptcha = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios_1 = require("axios");
const nodemailer = require("nodemailer");
// Initialize Firebase Admin
admin.initializeApp();
// Access the secret key from environment variables
const RECAPTCHA_SECRET_KEY = ((_a = functions.config().recaptcha) === null || _a === void 0 ? void 0 : _a.secret_key) || process.env.RECAPTCHA_SECRET_KEY || '';
// Configure email transporter using SendGrid SMTP
function getEmailTransporter() {
    var _a;
    const sendgridApiKey = ((_a = functions.config().email) === null || _a === void 0 ? void 0 : _a.sendgrid_key) || process.env.SENDGRID_API_KEY || '';
    if (!sendgridApiKey) {
        console.error('SENDGRID_API_KEY not found in config or environment variables');
    }
    return nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
            user: 'apikey',
            pass: sendgridApiKey,
        },
    });
}
let transporter = getEmailTransporter();
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
        console.log('reCAPTCHA Secret Key present:', !!RECAPTCHA_SECRET_KEY, 'Length:', RECAPTCHA_SECRET_KEY.length);
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
    var _a, _b;
    const { email, name } = data;
    if (!email) {
        return { success: false, error: 'Email is required' };
    }
    try {
        // Refresh transporter to get latest config
        transporter = getEmailTransporter();
        const emailPassword = ((_a = functions.config().email) === null || _a === void 0 ? void 0 : _a.password) || process.env.EMAIL_PASSWORD || '';
        console.log(`sendVerificationCode: Email: progredicontact@gmail.com, Password from config: ${!!((_b = functions.config().email) === null || _b === void 0 ? void 0 : _b.password)}, Password from env: ${!!process.env.EMAIL_PASSWORD}, Password length: ${emailPassword.length}`);
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
            .code { font-size: 56px; font-weight: 900; color: #C8956B; letter-spacing: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif; }
            .message { font-size: 16px; line-height: 1.6; color: #e0e0e0; margin: 20px 0; }
            .footer { text-align: center; font-size: 14px; color: #999999; margin-top: 40px; padding-top: 20px; border-top: 1px solid #1a1a1a; }
            .warning { background-color: rgba(207, 102, 121, 0.1); border-left: 4px solid #cf6679; padding: 15px; margin: 20px 0; border-radius: 4px; font-size: 14px; color: #e0e0e0; }
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
// Check username availability
exports.checkUsernameAvailability = functions.https.onCall(async (data, context) => {
    const { username } = data;
    if (!username) {
        return { available: false, error: 'Username is required' };
    }
    try {
        const db = admin.firestore();
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('username', '==', username).get();
        return { available: snapshot.empty };
    }
    catch (error) {
        console.error('Error checking username:', error);
        return { available: false, error: 'Failed to check username availability' };
    }
});
// Find user by access key (server-side for security)
exports.findUserByAccessKey = functions.https.onCall(async (data, context) => {
    const { accessKey } = data;
    if (!accessKey) {
        return { error: 'Access key is required' };
    }
    if (typeof accessKey !== 'string' || accessKey.length === 0) {
        return { error: 'Invalid access key format' };
    }
    try {
        const db = admin.firestore();
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('accessKey', '==', accessKey).get();
        if (snapshot.empty) {
            return { error: 'Invalid access key' };
        }
        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();
        if (!userData.email) {
            return { error: 'User account is incomplete' };
        }
        console.log(`User found by access key: ${userDoc.id}`);
        return { uid: userDoc.id, email: userData.email };
    }
    catch (error) {
        console.error('Error finding user by access key:', error);
        return { error: 'Failed to authenticate with access key' };
    }
});
// Generate custom token for access key login
exports.generateCustomToken = functions.https.onCall(async (data, context) => {
    const { uid } = data;
    if (!uid) {
        return { error: 'User ID is required' };
    }
    if (typeof uid !== 'string' || uid.length === 0) {
        return { error: 'Invalid user ID format' };
    }
    try {
        // Generate a custom token for the user
        const customToken = await admin.auth().createCustomToken(uid);
        console.log(`Custom token generated for user: ${uid}`);
        return { token: customToken };
    }
    catch (error) {
        console.error('Error generating custom token:', error);
        // Return specific error message for debugging
        return { error: `Failed to generate token: ${error.message || 'Unknown error'}` };
    }
});
//# sourceMappingURL=index.js.map