// ====================================================
// VALIDATION UTILITIES
// ====================================================
// Input validation helpers for secure data handling.

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
};

/**
 * Validate username format
 * - 3-30 characters
 * - Alphanumeric, underscores, hyphens
 * - Must start with a letter
 */
export const isValidUsername = (username) => {
  if (!username || typeof username !== 'string') return false;
  const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_-]{2,29}$/;
  return usernameRegex.test(username);
};

/**
 * Validate password strength
 * - Minimum 8 characters
 * - At least one letter
 * - At least one number
 */
export const isStrongPassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  if (password.length < 8 || password.length > 128) return false;
  
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  
  return hasLetter && hasNumber;
};

/**
 * Get password strength feedback
 */
export const getPasswordStrengthFeedback = (password) => {
  const feedback = [];
  
  if (!password || password.length < 8) {
    feedback.push('Password must be at least 8 characters');
  }
  if (!/[a-zA-Z]/.test(password)) {
    feedback.push('Password must contain at least one letter');
  }
  if (!/\d/.test(password)) {
    feedback.push('Password must contain at least one number');
  }
  
  return feedback;
};

/**
 * Validate UUID format
 */
export const isValidUUID = (id) => {
  if (!id || typeof id !== 'string') return false;
  const uuidRegex = /^[a-zA-Z0-9]{25}$/; // cuid format
  const standardUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id) || standardUuid.test(id);
};

/**
 * Validate pagination parameters
 */
export const validatePagination = (page, limit) => {
  const validPage = Math.max(1, parseInt(page, 10) || 1);
  const validLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (validPage - 1) * validLimit;
  
  return { page: validPage, limit: validLimit, skip };
};

/**
 * Sanitize and validate sort parameters
 */
export const validateSort = (sortBy, allowedFields, defaultField = 'createdAt') => {
  const field = allowedFields.includes(sortBy) ? sortBy : defaultField;
  return field;
};

/**
 * Validate sort order
 */
export const validateSortOrder = (order) => {
  return order?.toLowerCase() === 'asc' ? 'asc' : 'desc';
};
