// ====================================================
// CONTENT SANITIZATION UTILITIES
// ====================================================
// XSS protection through strict HTML sanitization.
// All user content must pass through these functions.

import sanitizeHtml from 'sanitize-html';
import { marked } from 'marked';

// Strict sanitization options for user content
const sanitizeOptions = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'ul', 'ol', 'li',
    'blockquote', 'pre', 'code',
    'strong', 'em', 'b', 'i', 'u', 's', 'strike',
    'a', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'span', 'div',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    code: ['class'],
    pre: ['class'],
    span: ['class'],
    div: ['class'],
    '*': ['id'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: {
    img: ['http', 'https', 'data'],
  },
  // Force safe link attributes
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        target: '_blank',
        rel: 'noopener noreferrer nofollow',
      },
    }),
  },
  // Strip all other tags
  disallowedTagsMode: 'discard',
  // Enforce URL protocols
  enforceHtmlBoundary: true,
  parseStyleAttributes: false,
};

// Even stricter options for plain text (no HTML allowed)
const plainTextOptions = {
  allowedTags: [],
  allowedAttributes: {},
};

/**
 * Sanitize HTML content
 * @param {string} dirty - Potentially unsafe HTML
 * @returns {string} - Sanitized HTML
 */
export const sanitizeContent = (dirty) => {
  if (!dirty || typeof dirty !== 'string') return '';
  return sanitizeHtml(dirty, sanitizeOptions);
};

/**
 * Convert Markdown to sanitized HTML
 * @param {string} markdown - Raw markdown content
 * @returns {string} - Sanitized HTML
 */
export const markdownToSafeHtml = (markdown) => {
  if (!markdown || typeof markdown !== 'string') return '';
  
  // Configure marked for security
  marked.setOptions({
    gfm: true,
    breaks: true,
    headerIds: false,
    mangle: false,
  });

  // Convert markdown to HTML
  const rawHtml = marked.parse(markdown);
  
  // Sanitize the resulting HTML
  return sanitizeContent(rawHtml);
};

/**
 * Strip all HTML, return plain text only
 * @param {string} dirty - HTML or text content
 * @returns {string} - Plain text
 */
export const stripHtml = (dirty) => {
  if (!dirty || typeof dirty !== 'string') return '';
  return sanitizeHtml(dirty, plainTextOptions).trim();
};

/**
 * Sanitize username/display name (alphanumeric + limited special chars)
 * @param {string} name - User input name
 * @returns {string} - Sanitized name
 */
export const sanitizeName = (name) => {
  if (!name || typeof name !== 'string') return '';
  // Allow letters, numbers, spaces, underscores, hyphens
  return name.replace(/[^a-zA-Z0-9\s_-]/g, '').trim().slice(0, 50);
};

/**
 * Generate URL-safe slug from text
 * @param {string} text - Input text
 * @returns {string} - URL-safe slug
 */
export const generateSlug = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
};
