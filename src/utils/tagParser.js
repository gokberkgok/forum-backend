// ====================================================
// TAG PARSER UTILITY
// ====================================================
// Parses hashtags from content and extracts tag names.

/**
 * Extract hashtags from content
 * Matches #tagname patterns (alphanumeric, Turkish chars, hyphens, underscores)
 * @param {string} content - The content to parse
 * @returns {string[]} - Array of unique tag names (without #)
 */
export function extractHashtags(content) {
  if (!content || typeof content !== 'string') {
    return [];
  }

  // Match hashtags: # followed by word characters (including Turkish)
  // Supports: letters, numbers, hyphens, underscores
  // Turkish characters: ğüşıöçĞÜŞİÖÇ
  const hashtagRegex = /#([a-zA-Z0-9_\-ğüşıöçĞÜŞİÖÇ]+)/g;
  
  const matches = content.match(hashtagRegex) || [];
  
  // Remove # prefix and get unique tags
  const tags = [...new Set(
    matches
      .map(tag => tag.slice(1).toLowerCase()) // Remove # and lowercase
      .filter(tag => tag.length >= 2 && tag.length <= 30) // Reasonable length
  )];

  return tags;
}

/**
 * Create slug from tag name
 * @param {string} name - Tag name
 * @returns {string} - URL-safe slug
 */
export function createTagSlug(name) {
  return name
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
