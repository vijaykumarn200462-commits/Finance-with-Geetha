/**
 * Sanitizes redirect target paths to prevent open redirect vulnerabilities.
 * Only allows relative paths on the same origin (e.g. /contact, /account).
 * Disallows protocol-relative URLs (//evil.com), javascript:, data:, or external schemes.
 */
export function getSafeRedirectUrl(target: string | null | undefined, fallback = '/'): string {
  if (!target) return fallback;

  const trimmed = target.trim();

  // Must begin with a single '/' and not '//'
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return fallback;
  }

  // Must not contain scheme delimiter
  if (trimmed.includes('://')) {
    return fallback;
  }

  // Disallow backslashes or repeated slashes at start
  if (/^[/\\]{2,}/.test(trimmed)) {
    return fallback;
  }

  // Allow standard internal paths like /contact, /store, /account, /community?foo=bar
  const safePathRegex = /^\/[a-zA-Z0-9_\-./?&=#%]*$/;
  if (!safePathRegex.test(trimmed)) {
    return fallback;
  }

  return trimmed;
}
