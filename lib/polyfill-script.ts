/**
 * Inline script for Safari browser compatibility polyfills
 * This needs to run BEFORE React hydrates to prevent errors
 * 
 * URL.parse() was added in:
 * - Chrome 126 (June 2024)
 * - Safari 18 (September 2024)
 * - Firefox 126 (May 2024)
 * 
 * Safari 17.x users (like macOS Sonoma users who haven't updated) will hit this error.
 */

export const polyfillScript = `
(function() {
  // Polyfill for URL.parse() - Safari 17 and earlier don't support this
  if (typeof URL.parse !== 'function') {
    URL.parse = function(url, base) {
      try {
        return new URL(url, base);
      } catch (e) {
        return null;
      }
    };
  }
})();
`;
