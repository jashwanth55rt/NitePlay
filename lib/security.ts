/**
 * Security utilities for URL validation and SSRF protection.
 * Restricts outbound server-side fetching strictly to authorized video and CDN hosts.
 */

const ALLOWED_HOSTNAMES = new Set([
  'xhamster.com',
  'www.xhamster.com',
  'xhcdn.com',
  'picsum.photos',
]);

const ALLOWED_HOSTNAME_SUFFIXES = [
  '.xhamster.com',
  '.xhcdn.com',
];

const DISALLOWED_IP_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^169\.254\./, // Link-local / Cloud metadata (e.g., AWS/GCP 169.254.169.254)
  /^0\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
  /^0x/i, // Hex-encoded IP
  /^[0-9]+$/, // Dword integer IP
];

/**
 * Validates whether a URL is secure and permitted for server-side fetching.
 * Returns true if valid, false otherwise.
 */
export function isAllowedExternalUrl(urlString: string): boolean {
  if (!urlString || typeof urlString !== 'string') return false;

  try {
    const parsed = new URL(urlString);

    // Enforce HTTPS only
    if (parsed.protocol !== 'https:') {
      return false;
    }

    // Only allow default HTTPS port
    if (parsed.port && parsed.port !== '443') {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block private, loopback, and metadata IPs
    for (const pattern of DISALLOWED_IP_PATTERNS) {
      if (pattern.test(hostname)) {
        return false;
      }
    }

    // Disallow userinfo (e.g., https://user:pass@evil.com)
    if (parsed.username || parsed.password) {
      return false;
    }

    // Check against authorized domains
    const isExplicitMatch = ALLOWED_HOSTNAMES.has(hostname);
    const isSuffixMatch = ALLOWED_HOSTNAME_SUFFIXES.some(suffix => hostname.endsWith(suffix));

    return isExplicitMatch || isSuffixMatch;
  } catch {
    return false;
  }
}

/**
 * Allowed MIME types for proxied images.
 */
export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/svg+xml',
]);

/**
 * Maximum permitted response size for image proxy (5MB).
 */
export const MAX_IMAGE_PROXY_BYTES = 5 * 1024 * 1024;

