/**
 * Simple ID generator using Web Crypto API
 */

/**
 * Generates a unique ID similar to nanoid
 */
export function generateId(length: number = 21): string {
  const array = new Uint8Array(Math.ceil(length * 3 / 4));
  crypto.getRandomValues(array);

  // Convert to base64url format
  const base64 = btoa(String.fromCharCode(...array));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
    .slice(0, length);
}
