/**
 * Validate username according to these rules:
 * - Length: 3-20 characters
 * - Allowed: letters (a-z, A-Z), numbers (0-9), dots (.), hyphens (-), underscores (_)
 * - Not allowed: offensive words, names that look official
 */

// List of reserved/offensive words to prevent
const RESERVED_WORDS = [
  'admin', 'administrator', 'root', 'system', 'official', 'support',
  'help', 'contact', 'info', 'news', 'test', 'demo', 'example',
  'prodegi', 'prodegi_official', 'prodegi_team', 'moderator', 'mod',
  // Add more as needed
];

export function validateUsername(username: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!username) {
    errors.push('Username is required');
    return { valid: false, errors };
  }

  const trimmed = username.trim();

  // Length check
  if (trimmed.length < 3) {
    errors.push('Username must be at least 3 characters long');
  }
  if (trimmed.length > 20) {
    errors.push('Username must not exceed 20 characters');
  }

  // Allowed characters check: letters, numbers, dots, hyphens, underscores
  if (!/^[a-zA-Z0-9._-]+$/.test(trimmed)) {
    errors.push('Username can only contain letters, numbers, dots, hyphens, and underscores');
  }

  // Check for reserved/official words
  const lowerUsername = trimmed.toLowerCase();
  if (RESERVED_WORDS.some(word => lowerUsername === word || lowerUsername.includes(word))) {
    errors.push('This username is reserved or not allowed');
  }

  // No consecutive special characters
  if (/[._-]{2,}/.test(trimmed)) {
    errors.push('Username cannot have consecutive special characters');
  }

  // Cannot start or end with special characters
  if (/^[._-]|[._-]$/.test(trimmed)) {
    errors.push('Username cannot start or end with special characters');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
