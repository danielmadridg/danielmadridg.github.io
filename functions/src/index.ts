import * as functions from 'firebase-functions';
import axios from 'axios';

// Access the secret key from environment variables
// In production, set this via: firebase functions:config:set recaptcha.secret="YOUR_SECRET_KEY"
// Or use: defineSecret('RECAPTCHA_SECRET_KEY')
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY || '6LeI5BwsAAAAAFWR_dtUnzfIpXNHU0RtY4i8J1Dq'; // Fallback for dev only

interface VerifyRecaptchaResponse {
  success: boolean;
  score?: number;
  action?: string;
  error?: string;
}

export const verifyRecaptcha = functions.https.onCall(async (data, context): Promise<VerifyRecaptchaResponse> => {
  const { token } = data;

  if (!token) {
    return { success: false, error: 'Token is missing' };
  }

  try {
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify`,
      null,
      {
        params: {
          secret: RECAPTCHA_SECRET_KEY,
          response: token,
        },
      }
    );

    const { success, score, action } = response.data;

    // Log the result for debugging (remove in production if sensitive)
    console.log(`reCAPTCHA verification: success=${success}, score=${score}, action=${action}`);

    // Score ranges from 0.0 to 1.0
    // 1.0 = likely human, 0.0 = likely bot
    // Adjust threshold based on your needs (typically 0.5)
    if (success && score && score > 0.5) {
      return { success: true, score, action };
    } else {
      console.warn(`reCAPTCHA failed: score too low (${score})`);
      return { success: false, score, action, error: 'Bot detected or score too low' };
    }
  } catch (error) {
    console.error('reCAPTCHA verification failed:', error);
    return { success: false, error: 'Verification failed' };
  }
});
