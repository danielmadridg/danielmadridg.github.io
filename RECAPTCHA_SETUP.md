# reCAPTCHA v3 Setup Guide

This document contains important information about the reCAPTCHA v3 integration in the Prodegi application.

## Overview

reCAPTCHA v3 has been integrated into the login and registration pages to protect against abuse and automated attacks. The implementation uses the `react-google-recaptcha-v3` package.

## Configuration

### Environment Variables

The reCAPTCHA site key is configured via environment variables:

**File: `.env.local`**

```env
VITE_RECAPTCHA_SITE_KEY=6LeI5BwsAAAAAGMtS2CM8KyfybN32SPX__eiHR0T
```

This file is already created in the project root and should **never be committed to version control** if it contains sensitive data.

### Available Environment Variables

- `VITE_RECAPTCHA_SITE_KEY`: The public site key used by the browser (safe to expose)
  - Current Value: `6LeI5BwsAAAAAGMtS2CM8KyfybN32SPX__eiHR0T`

## Secret Key (IMPORTANT - DO NOT EXPOSE)

⚠️ **SECURITY WARNING**: The reCAPTCHA secret key should **NEVER** be committed to version control or exposed in client-side code.

**Secret Key**: `6LeI5BwsAAAAAFWR_dtUnzfIpXNHU0RtY4i8J1Dq`

This secret key is used **only on the backend server** for validating reCAPTCHA tokens. Keep it safe and secure.

### Where to Store the Secret Key

Store the secret key in:
- Backend environment variables (e.g., Firebase Cloud Functions, Node.js server)
- Docker secrets or Kubernetes secrets (if deployed)
- Cloud provider secret managers (AWS Secrets Manager, Google Cloud Secret Manager, etc.)
- `.env` or `.env.production` (but ONLY on the server, never in git)

## How It Works

### Client-Side Flow

1. **User initiates login/registration** on the Login page
2. **reCAPTCHA v3 executes silently** with an action:
   - `'signin'` - for email sign-in
   - `'signup'` - for email registration
   - `'google_signin'` - for Google sign-in
3. **Token is generated** and stored
4. **Authentication proceeds** if token is valid

### Server-Side Validation (Backend Implementation)

To properly secure your application, implement token validation on your backend:

#### Firebase Cloud Function Example

```typescript
import * as functions from 'firebase-functions';
import axios from 'axios';

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

export const verifyRecaptcha = functions.https.onCall(async (data, context) => {
  const { token } = data;

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

    // Score ranges from 0.0 to 1.0
    // 1.0 = likely human, 0.0 = likely bot
    // Adjust threshold based on your needs (typically 0.5)
    if (success && score > 0.5) {
      return { success: true, score, action };
    } else {
      return { success: false, score, action };
    }
  } catch (error) {
    console.error('reCAPTCHA verification failed:', error);
    return { success: false };
  }
});
```

#### Node.js Express Example

```javascript
const express = require('express');
const axios = require('axios');

const app = express();
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

app.post('/api/verify-captcha', async (req, res) => {
  const { token } = req.body;

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

    if (success && score > 0.5) {
      res.json({ success: true, score });
    } else {
      res.status(403).json({ success: false, score });
    }
  } catch (error) {
    res.status(500).json({ error: 'Verification failed' });
  }
});
```

## Score Interpretation

reCAPTCHA v3 returns a **score from 0.0 to 1.0**:

- **1.0**: Very likely a legitimate user
- **0.5**: Neutral (recommend requiring additional verification)
- **0.0**: Very likely a bot

### Recommended Thresholds

- **Authentication (login/signup)**: Score > 0.5
- **High-risk actions** (password reset, account deletion): Score > 0.7
- **Comment/forum posts**: Score > 0.3

## Integration Points

### Files Modified

1. **src/App.tsx**
   - Wrapped entire app with `GoogleReCaptchaProvider`
   - Configured with site key from environment

2. **src/pages/Login.tsx**
   - Integrated `useGoogleReCaptcha()` hook
   - Execute reCAPTCHA before email auth (signin/signup)
   - Execute reCAPTCHA before Google sign-in
   - Added error handling for failed verification

3. **src/locales/translations.ts**
   - Added `error_captcha_failed` message in all 4 languages:
     - English, Spanish, French, Italian

## Testing

### Development Testing

The current configuration uses the test site key. For proper testing:

1. **With test key**: reCAPTCHA will always pass (returns score 1.0)
2. **With production key**: reCAPTCHA will score user interactions realistically

### Test Your Implementation

1. Start the dev server: `npm run dev`
2. Navigate to the login page
3. Attempt to sign in or sign up
4. Monitor the browser console (Network tab) to see reCAPTCHA requests
5. Check that tokens are being generated

## Production Deployment

### Checklist

- [ ] Set `VITE_RECAPTCHA_SITE_KEY` in your production environment
- [ ] Store `RECAPTCHA_SECRET_KEY` securely on your backend
- [ ] Implement backend token validation
- [ ] Test authentication flows in staging environment
- [ ] Monitor reCAPTCHA analytics in Google Console
- [ ] Set up score thresholds appropriate for your use case
- [ ] Add logging for captcha verification failures
- [ ] Implement fallback authentication for edge cases

### Google Cloud Console

Monitor and adjust your reCAPTCHA settings at:
https://www.google.com/recaptcha/admin

## Troubleshooting

### "reCAPTCHA verification failed" Error

**Possible causes:**
1. Environment variable not set correctly
2. Site key is invalid or expired
3. Site key doesn't match the domain
4. reCAPTCHA service is temporarily unavailable

**Solutions:**
1. Verify `VITE_RECAPTCHA_SITE_KEY` in `.env.local`
2. Regenerate keys in Google reCAPTCHA console
3. Ensure domain is registered in reCAPTCHA settings
4. Check browser console for detailed errors

### Token Not Generating

**Possible causes:**
1. GoogleReCaptchaProvider not wrapping the app
2. useGoogleReCaptcha hook called outside provider context
3. Network connectivity issues

**Solutions:**
1. Verify App.tsx has GoogleReCaptchaProvider wrapper
2. Check that useGoogleReCaptcha is only called in components inside the provider
3. Check network requests in browser DevTools

## Security Best Practices

1. **Never expose the secret key** in frontend code, git history, or environment variables sent to browser
2. **Always validate on the backend** - don't trust client-side reCAPTCHA responses
3. **Use appropriate score thresholds** - adjust based on false positive/negative rates
4. **Monitor abuse patterns** - use Google's analytics dashboard
5. **Implement rate limiting** - add additional protection beyond reCAPTCHA
6. **Log verification attempts** - track failed attempts for security analysis

## References

- [reCAPTCHA v3 Documentation](https://developers.google.com/recaptcha/docs/v3)
- [react-google-recaptcha-v3 Package](https://github.com/T-Rax/react-google-recaptcha-v3)
- [Google reCAPTCHA Console](https://www.google.com/recaptcha/admin)

## Support

For issues or questions about reCAPTCHA integration, refer to:
- Google's official documentation
- Package repository issues
- Your hosting provider's security guidelines
