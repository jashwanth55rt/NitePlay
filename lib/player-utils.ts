/**
 * Pure utility functions for NitePlay video streaming application.
 * Decoupled from React DOM for fast unit testing with node:test.
 */

export interface VideoItem {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  previewVideo?: string;
  duration?: string;
  durationSeconds?: number;
  views?: string;
  rating?: number;
  uploader?: string;
  uploaderUrl?: string;
  uploaderSubscribers?: number;
  categories?: string[];
  tags?: string[];
  m3u8Url?: string;
  likes?: number;
  dislikes?: number;
}

export interface WatchHistoryEntry {
  video: VideoItem;
  currentTime: number;
  duration: number;
  progressPercent: number;
  updatedAt: number;
}

/**
 * Formats seconds into mm:ss or hh:mm:ss.
 */
export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const totalSecs = Math.floor(seconds);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  const paddedMins = mins.toString().padStart(2, '0');
  const paddedSecs = secs.toString().padStart(2, '0');

  if (hrs > 0) {
    return `${hrs}:${paddedMins}:${paddedSecs}`;
  }
  return `${paddedMins}:${paddedSecs}`;
}

/**
 * Parses time string like "10:12" or "1:02:15" into total seconds.
 */
export function parseDurationString(durationStr: string): number {
  if (!durationStr || typeof durationStr !== 'string') return 0;
  const parts = durationStr.trim().split(':').map(p => parseInt(p, 10));
  if (parts.some(isNaN)) return 0;

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    return parts[0];
  }
  return 0;
}

/**
 * Formats raw view counts or strings cleanly (e.g., 411800 -> "411.8K", 1500000 -> "1.5M").
 */
export function formatViews(views: number | string | undefined): string {
  if (views === undefined || views === null) return '0 views';
  if (typeof views === 'string') {
    if (views.toLowerCase().includes('views')) return views;
    const parsed = parseFloat(views.replace(/[^0-9.]/g, ''));
    if (isNaN(parsed)) return views;
    if (views.toLowerCase().includes('k')) return `${parsed}K views`;
    if (views.toLowerCase().includes('m')) return `${parsed}M views`;
    views = parsed;
  }

  const num = Number(views);
  if (isNaN(num)) return '0 views';

  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M views`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}K views`;
  }
  return `${num} views`;
}

/**
 * Calculates watch progress percentage rounded to 1 decimal place (0-100).
 */
export function calculateProgress(currentTime: number, duration: number): number {
  if (!duration || duration <= 0 || !currentTime || currentTime <= 0) return 0;
  const pct = (currentTime / duration) * 100;
  return Math.min(100, Math.max(0, Math.round(pct * 10) / 10));
}

/**
 * Builds xHamster search query string with filters according to provided client specs.
 */
export interface SearchParams {
  query?: string;
  category?: string;
  sortBy?: 'views' | 'newest' | 'best' | 'longest';
  quality?: '720p' | '1080p' | '2160p';
  minDuration?: '2' | '5' | '10' | '30' | '40';
  page?: number;
}

export function buildSearchUrl(params: SearchParams): string {
  const query = params.query ? encodeURIComponent(params.query.trim()) : 'all';
  const page = params.page && params.page > 1 ? `/${params.page}` : '';
  const basePath = `https://xhamster.com/search/${query}${page}`;

  const queryParams = new URLSearchParams();
  if (params.quality) queryParams.set('quality', params.quality);
  if (params.sortBy) queryParams.set('sort', params.sortBy);
  if (params.category) queryParams.set('cats', params.category);
  if (params.minDuration) queryParams.set('min-duration', params.minDuration);

  const qs = queryParams.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/**
 * Deduplicates and updates watch history array with latest entry at front.
 */
export function updateHistoryList(
  currentList: WatchHistoryEntry[],
  newEntry: WatchHistoryEntry,
  maxEntries = 50
): WatchHistoryEntry[] {
  const filtered = currentList.filter(item => item.video.id !== newEntry.video.id);
  const updated = [newEntry, ...filtered];
  return updated.slice(0, maxEntries);
}

/**
 * Filters continue watching list (keeps items between 3% and 95% watched).
 */
export function getContinueWatchingList(history: WatchHistoryEntry[]): WatchHistoryEntry[] {
  return history.filter(item => item.progressPercent >= 3 && item.progressPercent <= 95);
}

/**
 * Determines whether forced CSS rotation is needed for orientation locking.
 * Returns true if locked, currently in portrait, and native lock was not applied.
 */
export function shouldApplyCssRotation(isLocked: boolean, isPortrait: boolean, nativeLockApplied: boolean): boolean {
  return isLocked && isPortrait && !nativeLockApplied;
}

/**
 * Returns accessible label for screen orientation lock button.
 */
export function getOrientationLockLabel(isLocked: boolean): string {
  return isLocked ? 'Unlock screen orientation' : 'Lock screen orientation to landscape';
}

/**
 * Generates an SVG Data URI poster uniquely derived from the video ID and title.
 * Used as a deterministic zero-duplicate fallback if external CDN images fail or get blocked.
 */
export function generateUniqueVideoPoster(id: string, title: string): string {
  let hash = 0;
  const str = id || title || 'niteplay';
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const palettes = [
    { from: '#1a0826', to: '#4a154b', accent: '#E50914' },
    { from: '#0f172a', to: '#1e3a8a', accent: '#38bdf8' },
    { from: '#1c1917', to: '#44403c', accent: '#f59e0b' },
    { from: '#14141f', to: '#2b1055', accent: '#ec4899' },
    { from: '#062820', to: '#0f4c3a', accent: '#10b981' },
    { from: '#2e0814', to: '#581024', accent: '#ff4d6d' },
    { from: '#18181b', to: '#27272a', accent: '#a855f7' },
    { from: '#111827', to: '#1f2937', accent: '#E50914' },
  ];
  const choice = palettes[Math.abs(hash) % palettes.length];
  const safeTitle = (title || 'Video')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .slice(0, 48);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="100%" height="100%">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${choice.from}" />
        <stop offset="100%" stop-color="${choice.to}" />
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${choice.accent}" stop-opacity="0.35" />
        <stop offset="100%" stop-color="${choice.accent}" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="640" height="360" fill="url(#grad)" />
    <circle cx="320" cy="165" r="130" fill="url(#glow)" />
    <circle cx="320" cy="150" r="32" fill="#E50914" opacity="0.9" />
    <polygon points="314,138 332,150 314,162" fill="#ffffff" />
    <text x="320" y="235" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle">${safeTitle}</text>
    <text x="320" y="260" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#94a3b8" text-anchor="middle">NitePlay Premium</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

