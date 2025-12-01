/**
 * Application-wide constants
 */

// Verification code constants
export const VERIFICATION_CODE_TIMEOUT = 600; // 10 minutes in seconds
export const VERIFICATION_CODE_WARNING_TIME = 540; // 9 minutes in seconds

// Access key constants
export const ACCESS_KEY_LENGTH = 12; // Total characters
export const ACCESS_KEY_SEGMENT_LENGTH = 4; // Characters per segment
export const ACCESS_KEY_EXCLUDED_CHARS = 'IO0'; // Ambiguous characters to exclude

// Timeout constants
export const DEFAULT_MESSAGE_TIMEOUT = 2000; // 2 seconds
export const SUCCESS_MESSAGE_TIMEOUT = 3000; // 3 seconds

// Validation constants
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_USERNAME_LENGTH = 50;

// Mobile breakpoints
export const MOBILE_BREAKPOINT = 768;
export const SMALL_MOBILE_BREAKPOINT = 480;
