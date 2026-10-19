import {
  VideoItem,
  parseDurationString,
  formatDuration,
  formatViews,
  generateUniqueVideoPoster,
} from './player-utils';
export type { VideoItem };

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const COOKIES = 'cookie_accept_v2=%7B%22e%22%3A1%2C%22f%22%3A1%2C%22t%22%3A1%2C%22a%22%3A1%7D; age_confirmed=1';

export interface VideoDetails extends VideoItem {
  mp4Urls?: string[];
  uploaderSubscribers?: number;
  description?: string;
  relatedVideos?: VideoItem[];
}

export interface PopularCategory {
  id: string;
  name: string;
  iconName?: string;
  videoCount?: string;
}

export const POPULAR_CATEGORIES: PopularCategory[] = [
  { id: 'amateur', name: 'Amateur', videoCount: '1.2M+' },
  { id: 'asian', name: 'Asian', videoCount: '890K+' },
  { id: 'milf', name: 'MILF', videoCount: '1.5M+' },
  { id: '4k', name: '4K Ultra HD', videoCount: '340K+' },
  { id: 'vr', name: 'VR / 3D', videoCount: '95K+' },
  { id: 'lesbian', name: 'Lesbian', videoCount: '780K+' },
  { id: 'blowjob', name: 'Blowjob', videoCount: '2.1M+' },
  { id: 'mature', name: 'Mature', videoCount: '620K+' },
  { id: 'japanese', name: 'Japanese JAV', videoCount: '450K+' },
  { id: 'teen', name: '18+ College', videoCount: '980K+' },
  { id: 'big-tits', name: 'Big Tits', videoCount: '1.8M+' },
  { id: 'anal', name: 'Anal', videoCount: '1.1M+' },
  { id: 'cosplay', name: 'Cosplay & Hentai', videoCount: '210K+' },
  { id: 'ebony', name: 'Ebony', videoCount: '540K+' },
  { id: 'latina', name: 'Latina', videoCount: '820K+' },
  { id: 'creampie', name: 'Creampie', videoCount: '1.3M+' },
];

/**
 * Curated high-fidelity fallback items ensuring zero-blank-screen resilience
 * if external network or cloud scraper experiences brief latency.
 */
export const SEED_VIDEOS: VideoItem[] = [
  {
    id: '30627130',
    title: 'Asian Cutie Met on Sex-Dater',
    url: 'https://xhamster.com/videos/asian-cutie-met-on-sex-dater-xh407Av',
    thumbnail: 'https://ic-vt-nss.xhcdn.com/a/NDdlZTEwNGIwOTEwZGQwZGE2OTFlZjc2ZjE4OTg0Mjk/s(w:1280,h:720),webp/030/627/130/v2/2560x1440.238.webp',
    previewVideo: 'https://thumb-v0.xhcdn.com/a/7pOyE1Umczk5sGh8O3Twzw/030/627/130/526x298.94.3.4.t.mp4',
    m3u8Url: 'https://video-nss.xhcdn.com/yu0atwt5sCzeF0Ya_kyvGg==,1792335600/media=hls4/multi=256x144:144p:,426x240:240p:,854x480:480p:,1280x720:720p:,1920x1080:1080p:/031/203/210/_TPL_.av1.mp4.m3u8',
    duration: '23:52',
    durationSeconds: 1432,
    views: '15.3M views',
    rating: 96,
    likes: 8400,
    dislikes: 120,
    uploader: 'AsianFlirt',
    categories: ['Asian', 'POV', 'Dating', 'HD Videos'],
    tags: ['Amateur', 'Cute', 'Romance'],
  },
  {
    id: '30731534',
    title: 'A Two-day One-night Cum-draining Trip with My Insatiable Stepmother',
    url: 'https://xhamster.com/videos/a-two-day-one-night-cum-draining-trip-with-my-insatiable-stepmother-pies-after-being-milked-dry-and-awakening-to-sex-chapter-2-xhv8yDA',
    thumbnail: 'https://ic-vt-nss.xhcdn.com/a/MDVkNGJkMGVkM2ViMTk1ODI3MDQwZmE0YjFiMzA1Yzg/s(w:1280,h:720),webp/030/731/534/1280x720.17899553.jpg',
    previewVideo: 'https://thumb-v4.xhcdn.com/a/nufGASIoUO9FMytyNFrcdA/030/731/534/526x298.94.3.3.t.mp4',
    duration: '31:22',
    durationSeconds: 1882,
    views: '5.3M views',
    rating: 97,
    likes: 4200,
    dislikes: 65,
    uploader: 'TokyoStudio',
    categories: ['JAV', 'Mature', 'Stepmom', 'Creampie'],
    tags: ['HD', 'Intense', 'Uncensored'],
  },
  {
    id: '30909750',
    title: 'JAV Uncensored: First Time Interracial Creampie - Shy Petite Japanese Babe',
    url: 'https://xhamster.com/videos/jav-uncensored-first-time-interracial-creampie-shy-petite-japanese-babe-vs-big-white-cock-xhQCDg4',
    thumbnail: 'https://ic-vt-nss.xhcdn.com/a/ZDY4M2RiOGJmZmU4Mzg4ZjE3ZWI4ZDczYTUxYmYxYzY/s(w:1280,h:720),webp/030/909/750/v2/2560x1440.204.webp',
    previewVideo: 'https://thumb-v0.xhcdn.com/a/9darCCKcX9Nori_D2Nvcbg/030/909/750/526x298.94.3.3.t.mp4',
    duration: '18:42',
    durationSeconds: 1122,
    views: '2.7M views',
    rating: 95,
    likes: 3100,
    dislikes: 80,
    uploader: 'ExclusiveJAV',
    categories: ['Asian', 'Interracial', 'Petite', 'Creampie'],
    tags: ['Japanese', 'Uncensored', 'POV'],
  },
  {
    id: '31114927',
    title: 'This Room Makes My Crotch Tingle Neighbor Girl and Her Friends',
    url: 'https://xhamster.com/videos/this-room-makes-my-crotch-tingle-neighbor-girl-and-her-friends-ng-dirty-room-chain-creampies-one-after-another-chapter-2-xhjeuCs',
    thumbnail: 'https://ic-vt-nss.xhcdn.com/a/MTc1MzMyYzk1ZmE0ZGJkMWI5ODcwZWU5M2Y5MzMyMTc/s(w:1280,h:720),webp/031/114/927/v2/2560x1440.273.webp',
    previewVideo: 'https://thumb-v7.xhcdn.com/a/aQahDmExposCV6UUFXp1DA/031/114/927/526x298.94.3.3.t.mp4',
    duration: '43:36',
    durationSeconds: 2616,
    views: '4.9M views',
    rating: 98,
    likes: 7100,
    dislikes: 90,
    uploader: 'CinemaX',
    categories: ['College', 'Group', 'Creampie', 'Full Length'],
    tags: ['4K', 'Storyline', 'Top Rated'],
  },
  {
    id: '29654592',
    title: 'Why Are You Stealing My Panties... Step Bro?',
    url: 'https://xhamster.com/videos/why-are-you-stealing-my-panties-step-bro-xhuTa4g',
    thumbnail: 'https://ic-vt-nss.xhcdn.com/a/YTc1YmE4ZWE0NDljODcxNThkNTEyNzgwNjdiNWZmYWI/s(w:1280,h:720),webp/029/654/592/1280x720.17794479.jpg',
    previewVideo: 'https://thumb-v2.xhcdn.com/a/_wYY29W_-eUfGxfXpXPNIQ/029/654/592/526x298.94.3.4.t.mp4',
    duration: '25:19',
    durationSeconds: 1519,
    views: '100.5M views',
    rating: 99,
    likes: 45000,
    dislikes: 620,
    uploader: 'FamilyTherapy',
    categories: ['Taboo', 'Lingerie', 'Blonde', 'POV'],
    tags: ['Viral', 'Trending', 'Hot'],
  },
  {
    id: '30408604',
    title: 'Elite VIP Penthouse Romance and Sensual Massage',
    url: 'https://xhamster.com/videos/elite-vip-penthouse-30408604',
    thumbnail: 'https://ic-vt-nss.xhcdn.com/a/ZjUyNzQ2OGI1OTYxZDI2NGEyZTYwNDRiZTY5ODJiNTk/s(w:1280,h:720),webp/030/408/604/v2/2560x1440.210.webp',
    previewVideo: 'https://thumb-v4.xhcdn.com/a/7AB5Lygi5obSwpTPkbU04w/030/408/604/526x298.94.3.4.t.mp4',
    duration: '35:40',
    durationSeconds: 2140,
    views: '3.1M views',
    rating: 96,
    likes: 5400,
    dislikes: 48,
    uploader: 'DiamondLounge',
    categories: ['VIP', 'Luxury', 'Massage', 'POV'],
    tags: ['4K', 'Penthouse', 'High Quality'],
  },
  {
    id: '29278763',
    title: 'My Stepmother, Who Is More Energetic Than Her Husband, Drowns In Pleasure',
    url: 'https://xhamster.com/videos/my-stepmother-who-is-more-energetic-than-her-husband-drowns-in-pleasure-and-begs-for-more-xh6gHXo',
    thumbnail: 'https://ic-vt-nss.xhcdn.com/a/OTIxY2M2OTE5MWU2NTFmOTA5NzQ1ZjAyNmRmNzgwOTY/s(w:1280,h:720),webp/029/278/763/1280x720.17755570.jpg',
    previewVideo: 'https://thumb-v3.xhcdn.com/a/8zRtxyYrjj1JyxUqU7PHLg/029/278/763/526x298.94.3.5.t.mp4',
    duration: '41:39',
    durationSeconds: 2499,
    views: '22.2M views',
    rating: 97,
    likes: 12400,
    dislikes: 210,
    uploader: 'VelvetCinema',
    categories: ['Mature', 'MILF', 'Brunette', 'HD Videos'],
    tags: ['Passionate', 'Erotic', 'Full Scene'],
  },
  {
    id: '31203210',
    title: 'Fair Skinned Former Idol with Rocket Curves Serves in Pink Maid Style',
    url: 'https://xhamster.com/videos/fair-skinned-former-idol-with-rocket-curves-serves-in-pink-maid-style-and-ends-with-a-raw-creampie-xh96VFD',
    thumbnail: 'https://ic-vt-nss.xhcdn.com/a/MTdjNzZkMWJmNTI0MWU5NDNiMmY1NWM4M2E3YTNiOGM/s(w:1280,h:720),webp/031/203/210/v2/2560x1440.225.webp',
    previewVideo: 'https://thumb-v0.xhcdn.com/a/aPO3OU_NJARJhu2Dws4HAQ/031/203/210/526x298.94.3.3.t.mp4',
    duration: '10:12',
    durationSeconds: 612,
    views: '411.8K views',
    rating: 98,
    likes: 2460,
    dislikes: 38,
    uploader: 'kazmaxa',
    categories: ['Asian', 'JAV', 'Maid', 'Creampie', 'POV'],
    tags: ['HD', 'Former Idol', 'Intense', 'Uncensored'],
  },
  {
    id: '8149863',
    title: 'Busty Japanese Girl Premium Session',
    url: 'https://xhamster.com/videos/busty-japanese-girl-8149863',
    thumbnail: 'https://ic-vt-nss.xhcdn.com/a/OGJhZGUzZDZiOGE4YzgxZGY1YTA1NDU2NDI3ZmNhYzM/s(w:1280,h:720),webp/008/149/863/v2/2560x1440.292.webp',
    previewVideo: 'https://thumb-v3.xhcdn.com/a/nchlIIxZ8yVj-trdaJevIA/008/149/863/526x298.94.3.5.t.mp4',
    duration: '18:45',
    durationSeconds: 1125,
    views: '890.2K views',
    rating: 96,
    likes: 4120,
    dislikes: 95,
    uploader: 'TokyoStudio',
    categories: ['Asian', 'Big Tits', 'JAV', 'HD Videos'],
    tags: ['Japanese', 'Busty', 'Curvy', 'Solo'],
  },
  {
    id: '24746023',
    title: 'Hot College Fucks - Nikki Take',
    url: 'https://xhamster.com/videos/hot-college-fucks-nikki-take-24746023',
    thumbnail: 'https://ic-vt-nss.xhcdn.com/a/ZmNhMDU3ZmU0ZWZkNTg0OWY0MzNjYjRjNWIyN2YyMTY/s(w:1280,h:720),webp/024/746/023/1280x720.17175488.jpg',
    previewVideo: 'https://thumb-v3.xhcdn.com/a/I-9zpah-TkC6OY4kjJXyzQ/024/746/023/526x298.94.3.3.t.mp4',
    duration: '15:20',
    durationSeconds: 920,
    views: '1.8M views',
    rating: 96,
    likes: 6300,
    dislikes: 85,
    uploader: 'CampusStories',
    categories: ['Amateur', 'College', 'Blonde', 'POV'],
    tags: ['Dorm', 'Sweet', 'Flirty'],
  },
  {
    id: '29500233',
    title: 'Big Step Bro Cums Inside Bookworm',
    url: 'https://xhamster.com/videos/big-step-bro-cums-inside-bookworm-29500233',
    thumbnail: 'https://ic-vt-nss.xhcdn.com/a/MTJmZjcwY2Y0OTc1YzMxODNkNmNjODc3Zjg1MjA1N2U/s(w:1280,h:720),webp/029/500/233/v2/2560x1440.216.webp',
    previewVideo: 'https://thumb-v3.xhcdn.com/a/PNxHJDEidTh_o-Whx1JLyQ/029/500/233/526x298.94.3.3.t.mp4',
    duration: '22:15',
    durationSeconds: 1335,
    views: '8.4M views',
    rating: 97,
    likes: 9200,
    dislikes: 130,
    uploader: 'TabooLovers',
    categories: ['Glasses', 'Creampie', 'Teens', 'HD Videos'],
    tags: ['Bookworm', 'Stepmom', 'Shy'],
  },
  {
    id: '30673820',
    title: 'Lewd Wife: Continuous Climaxes and Endless Pleasure',
    url: 'https://xhamster.com/videos/lewd-wife-continuous-climaxes-30673820',
    thumbnail: 'https://ic-vt-nss.xhcdn.com/a/ZGFlODY0NzFiZTAzYTI4MmE5YjgzN2E1NDI3MTA2MTU/s(w:1280,h:720),webp/030/673/820/1280x720.17887543.jpg',
    previewVideo: 'https://thumb-v0.xhcdn.com/a/uHC7CQB_JXPphZUXcWsj_A/030/673/820/526x298.94.3.3.t.mp4',
    duration: '28:40',
    durationSeconds: 1720,
    views: '3.6M views',
    rating: 98,
    likes: 5800,
    dislikes: 72,
    uploader: 'TokyoStudio',
    categories: ['JAV', 'Mature', 'Wife', 'Squirting'],
    tags: ['Sensual', 'Intense', 'Uncensored'],
  },
];

/**
 * Extracts rich video list directly from window.initials JSON payload in xHamster HTML.
 * Modern xHamster renders initial cards through hydration, storing all 50 full video metadata
 * objects (including 100% unique imageURL and thumbURL values) in window.initials.
 */
export function extractVideosFromInitials(html: string): VideoItem[] {
  const initIdx = html.indexOf('window.initials=');
  if (initIdx === -1) return [];

  const endIdx = html.indexOf(';</script>', initIdx);
  if (endIdx === -1) return [];

  try {
    const raw = html.slice(initIdx + 'window.initials='.length, endIdx);
    const data = JSON.parse(raw);

    // Look for videoThumbProps in layoutPage or searchResult or recursive scan
    const rawThumbs: any[] =
      data?.layoutPage?.videoListProps?.videoThumbProps ||
      data?.searchResult?.videoThumbProps ||
      data?.xplayerSettings?.videoThumbProps ||
      [];

    if (!Array.isArray(rawThumbs) || rawThumbs.length === 0) {
      return [];
    }

    const items: VideoItem[] = [];
    const seenThumbnails = new Set<string>();
    const seenIds = new Set<string>();

    for (const t of rawThumbs) {
      if (!t || !t.id || !t.title) continue;
      const id = String(t.id);
      if (seenIds.has(id)) continue;

      // Select highest resolution thumbnail available
      const thumbnail = t.imageURL || t.thumbURL || t.previewThumbURL;
      if (!thumbnail || seenThumbnails.has(thumbnail)) continue;

      const durationSec = typeof t.duration === 'number' ? t.duration : parseDurationString(String(t.duration || '600'));
      const duration = formatDuration(durationSec);

      seenThumbnails.add(thumbnail);
      seenIds.add(id);

      items.push({
        id,
        title: t.title,
        url: t.pageURL || `https://xhamster.com/videos/${id}`,
        thumbnail,
        previewVideo: t.trailerFallbackUrl || t.trailerURL || undefined,
        duration,
        durationSeconds: durationSec,
        views: t.views ? (typeof t.views === 'number' ? formatViews(t.views) : String(t.views)) : '100K views',
        rating: 95,
        uploader: t.landing?.name || 'Creator',
        categories: ['Featured', 'Trending'],
        tags: ['HD', 'Top Quality'],
      });
    }

    return items;
  } catch (err) {
    console.warn('Failed to parse window.initials from HTML:', err);
    return [];
  }
}

/**
 * Extracts video cards from xHamster HTML page.
 * Prioritizes window.initials extraction for 100% unique high-res posters,
 * and falls back to regex matching for SSR cards.
 */
export function parseCardsFromHtml(html: string): VideoItem[] {
  // 1. Try window.initials first (modern xHamster includes all 46-50 complete video items)
  const initialsVideos = extractVideosFromInitials(html);
  if (initialsVideos.length >= 10) {
    return initialsVideos;
  }

  // 2. Fallback to regex card parsing
  const cards: VideoItem[] = [...initialsVideos];
  const seenThumbnails = new Set<string>(cards.map(c => c.thumbnail));
  const seenIds = new Set<string>(cards.map(c => c.id));
  const cardRegex = /<div[^>]*data-video-id=["'](\d+)["'][^>]*>([\s\S]*?)(?=<div[^>]*data-video-id|$)/g;
  let match: RegExpExecArray | null;

  while ((match = cardRegex.exec(html)) !== null) {
    const id = match[1];
    const cardContent = match[2];

    if (seenIds.has(id)) continue;

    // Extract thumbnail
    let thumbnail = '';
    const imgMatch =
      cardContent.match(/<img[^>]*src=["'](https:[^"']+)["']/) ||
      cardContent.match(/srcset=["'](https:[^"'\s]+)/);
    if (imgMatch) {
      thumbnail = imgMatch[1];
    }

    // STRICT UNIQUE THUMBNAIL RULE:
    // Skip lazy-loaded skeleton placeholder cards without an image!
    // Never assign a duplicate single fallback image to all subsequent cards!
    if (!thumbnail || seenThumbnails.has(thumbnail)) {
      continue;
    }

    // Extract title
    let title = '';
    const titleMatch =
      cardContent.match(/aria-label=["']([^"']+)["']/) ||
      cardContent.match(/title=["']([^"']+)["']/) ||
      cardContent.match(/video-thumb-info__name[^>]*>([^<]+)</);
    if (titleMatch) {
      title = titleMatch[1].trim();
    }

    if (!title || title.length < 3) continue;

    // Extract page URL
    let url = '';
    const hrefMatch = cardContent.match(/href=["'](https:\/\/xhamster\.com\/videos\/[^"']+)["']/);
    if (hrefMatch) {
      url = hrefMatch[1];
    } else {
      url = `https://xhamster.com/videos/${id}`;
    }

    // Extract preview video
    let previewVideo: string | undefined;
    const prevMatch =
      cardContent.match(/data-previewvideo-fallback=["'](https:[^"']+)["']/) ||
      cardContent.match(/data-previewvideo=["'](https:[^"']+)["']/);
    if (prevMatch) {
      previewVideo = prevMatch[1];
    }

    // Extract duration
    let duration = '10:00';
    const durMatch =
      cardContent.match(/video-duration["'][^>]*>[\s\S]*?<div[^>]*>[\s\S]*?([0-9:]+)[\s\S]*?<\/div>/) ||
      cardContent.match(/([0-9]{1,2}:[0-9]{2})/);
    if (durMatch) {
      duration = durMatch[1].trim();
    }

    // Extract views
    let views = '100K views';
    const viewMatch = cardContent.match(/video-thumb-views[^>]*>([^<]+)</);
    if (viewMatch) {
      views = viewMatch[1].trim();
    }

    // Extract uploader
    let uploader = 'Creator';
    const uploaderMatch = cardContent.match(/video-uploader__name[^>]*>([^<]+)</);
    if (uploaderMatch) {
      uploader = uploaderMatch[1].replace(/<!--.*?-->/g, '').trim();
    }

    // Extract rating
    let rating = 95;
    const ratingMatch = cardContent.match(/(\d+)%/);
    if (ratingMatch) {
      rating = parseInt(ratingMatch[1], 10);
    }

    seenThumbnails.add(thumbnail);
    seenIds.add(id);

    cards.push({
      id,
      title,
      url,
      thumbnail,
      previewVideo,
      duration,
      durationSeconds: parseDurationString(duration),
      views,
      rating,
      uploader,
    });
  }

  return cards;
}

/**
 * Fetches video lists for Home, Trending, Newest, or Categories.
 * Fetches multiple pages concurrently to ensure rich variety of cards with 100% unique images.
 */
export async function fetchVideos(options: {
  type?: 'home' | 'trending' | 'newest' | 'best' | 'category';
  category?: string;
  page?: number;
}): Promise<VideoItem[]> {
  const { type = 'home', category, page = 1 } = options;

  let url1 = 'https://xhamster.com/';
  let url2 = 'https://xhamster.com/best';

  if (type === 'newest') {
    url1 = page > 1 ? `https://xhamster.com/newest/${page}` : 'https://xhamster.com/newest';
    url2 = `https://xhamster.com/newest/${page + 1}`;
  } else if (type === 'best' || type === 'trending') {
    url1 = page > 1 ? `https://xhamster.com/best/${page}` : 'https://xhamster.com/best';
    url2 = `https://xhamster.com/best/${page + 1}`;
  } else if (type === 'category' && category) {
    url1 = page > 1 ? `https://xhamster.com/search/${encodeURIComponent(category)}/${page}?quality=720p` : `https://xhamster.com/search/${encodeURIComponent(category)}?quality=720p`;
    url2 = `https://xhamster.com/search/${encodeURIComponent(category)}/${page + 1}?quality=720p`;
  } else if (page > 1) {
    url1 = `https://xhamster.com/search/trending/${page}`;
    url2 = `https://xhamster.com/search/trending/${page + 1}`;
  }

  const fetchOptions = {
    headers: {
      'User-Agent': USER_AGENT,
      'Cookie': COOKIES,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    next: { revalidate: 300 },
  };

  try {
    const [res1, res2] = await Promise.all([
      fetch(url1, fetchOptions).catch(() => null),
      fetch(url2, fetchOptions).catch(() => null),
    ]);

    const html1 = res1 && res1.ok ? await res1.text() : '';
    const html2 = res2 && res2.ok ? await res2.text() : '';

    const cards1 = html1 ? parseCardsFromHtml(html1) : [];
    const cards2 = html2 ? parseCardsFromHtml(html2) : [];

    const combined: VideoItem[] = [];
    const seen = new Set<string>();

    for (const c of [...cards1, ...cards2]) {
      if (!seen.has(c.id) && !seen.has(c.thumbnail)) {
        seen.add(c.id);
        seen.add(c.thumbnail);
        combined.push(c);
      }
    }

    if (combined.length >= 6) {
      return combined;
    }

    // Merge with SEED_VIDEOS to ensure plenty of unique cards
    for (const s of SEED_VIDEOS) {
      if (!seen.has(s.id) && !seen.has(s.thumbnail)) {
        seen.add(s.id);
        seen.add(s.thumbnail);
        combined.push(s);
      }
    }

    return combined;
  } catch (err) {
    console.error('Error fetching xhamster videos:', err);
    return SEED_VIDEOS;
  }
}

/**
 * Searches xHamster videos with live filters and pagination.
 */
export async function searchVideosScraper(params: {
  query?: string;
  category?: string;
  sortBy?: 'views' | 'newest' | 'best' | 'longest';
  quality?: '720p' | '1080p' | '2160p';
  minDuration?: '2' | '5' | '10' | '30' | '40';
  page?: number;
}): Promise<{ videos: VideoItem[]; total: number; page: number }> {
  const page = params.page || 1;
  const rawQuery = params.query?.trim() || params.category || 'featured';
  const encodedQuery = encodeURIComponent(rawQuery);
  const pageSegment = page > 1 ? `/${page}` : '';

  const queryParams = new URLSearchParams();
  if (params.quality) queryParams.set('quality', params.quality);
  if (params.sortBy) queryParams.set('sort', params.sortBy);
  if (params.category && params.category !== rawQuery) queryParams.set('cats', params.category);
  if (params.minDuration) queryParams.set('min-duration', params.minDuration);

  const qs = queryParams.toString();
  const searchUrl = `https://xhamster.com/search/${encodedQuery}${pageSegment}${qs ? `?${qs}` : ''}`;

  try {
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Cookie': COOKIES,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      next: { revalidate: 180 },
    });

    if (!res.ok) {
      console.warn(`Search request status ${res.status} for ${searchUrl}`);
      const filteredSeed = SEED_VIDEOS.filter(v =>
        v.title.toLowerCase().includes(rawQuery.toLowerCase()) ||
        v.categories?.some(c => c.toLowerCase().includes(rawQuery.toLowerCase()))
      );
      return {
        videos: filteredSeed.length > 0 ? filteredSeed : SEED_VIDEOS,
        total: 50,
        page,
      };
    }

    const html = await res.text();
    const videos = parseCardsFromHtml(html);

    return {
      videos: videos.length > 0 ? videos : SEED_VIDEOS,
      total: videos.length > 0 ? 240 : SEED_VIDEOS.length,
      page,
    };
  } catch (err) {
    console.error('Error in searchVideosScraper:', err);
    return {
      videos: SEED_VIDEOS,
      total: SEED_VIDEOS.length,
      page,
    };
  }
}

/**
 * Fetches rich details for a specific video including authorized .m3u8 and .mp4 stream links.
 */
export async function getVideoDetails(videoIdentifier: string): Promise<VideoDetails | null> {
  let targetUrl = videoIdentifier;
  if (!targetUrl.startsWith('http')) {
    targetUrl = `https://xhamster.com/videos/${videoIdentifier}`;
  }

  const matchedSeed = SEED_VIDEOS.find(v => v.id === videoIdentifier || targetUrl.includes(v.id));

  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Cookie': COOKIES,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      next: { revalidate: 600 },
    });

    if (!res.ok) {
      console.warn(`Video details fetch returned status ${res.status} for ${targetUrl}`);
      return matchedSeed ? { ...matchedSeed, relatedVideos: SEED_VIDEOS.filter(v => v.id !== matchedSeed.id) } : SEED_VIDEOS[0];
    }

    const html = await res.text();

    // 1. Extract window.initials JSON if present
    let initialsData: Record<string, any> = {};
    const initIdx = html.indexOf('window.initials=');
    if (initIdx !== -1) {
      const endIdx = html.indexOf(';</script>', initIdx);
      if (endIdx !== -1) {
        try {
          const raw = html.slice(initIdx + 'window.initials='.length, endIdx);
          initialsData = JSON.parse(raw);
        } catch (e) {
          // ignore json parse error
        }
      }
    }

    // 2. Extract Title
    let title = '';
    const ogTitleMatch = html.match(/property=["']og:title["'] content=["']([^"']+)["']/);
    if (ogTitleMatch) {
      title = ogTitleMatch[1].replace(/ - xHamster.*$/i, '').trim();
    } else {
      const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
      if (h1Match) title = h1Match[1].replace(/<[^>]+>/g, '').trim();
    }

    // 3. Extract Thumbnail / Poster
    let thumbnail = '';
    const ogImgMatch = html.match(/property=["']og:image["'] content=["']([^"']+)["']/);
    if (ogImgMatch) {
      thumbnail = ogImgMatch[1];
    }

    // 4. Extract M3U8 Master Playlist Stream URL
    let m3u8Url = '';
    const m3u8Matches = html.match(/https?:(?:\\\/|\/)[^"'\s<>]+\.m3u8[^"'\s<>]*/g);
    if (m3u8Matches && m3u8Matches.length > 0) {
      m3u8Url = m3u8Matches[0].replace(/\\\//g, '/');
    }

    // 5. Extract direct MP4 streams
    const mp4Urls: string[] = [];
    const mp4Matches = html.match(/https?:(?:\\\/|\/)[^"'\s<>]+\.mp4[^"'\s<>]*/g);
    if (mp4Matches) {
      for (const m of mp4Matches) {
        const clean = m.replace(/\\\//g, '/');
        if (!mp4Urls.includes(clean)) {
          mp4Urls.push(clean);
        }
      }
    }

    // 6. Rating & Likes
    const ratingModel = initialsData.ratingComponent?.ratingModel || {};
    const rating = ratingModel.value || 95;
    const likes = ratingModel.likes || 1200;
    const dislikes = ratingModel.dislikes || 25;

    // 7. Categories, Tags, and Uploader from videoTagsComponent
    const tagsComponent = initialsData.videoTagsComponent?.tags || [];
    const categories: string[] = [];
    const tags: string[] = [];
    let uploader = '';

    for (const t of tagsComponent) {
      if (t.isCategory && t.name) categories.push(t.name);
      if (t.isTag && t.name) tags.push(t.name);
      if (t.isUser && t.name) uploader = t.name;
    }

    // Fallback uploader from uploader link in HTML
    if (!uploader) {
      const uploaderMatch = html.match(/class=["'][^"']*video-uploader__name[^"']*["'][^>]*>([^<]+)</);
      if (uploaderMatch) uploader = uploaderMatch[1].trim();
    }

    // 8. Duration
    const durationSec = initialsData.xplayerSettings?.duration || 600;
    const duration = formatDuration(durationSec);

    // 9. Video ID
    const videoId =
      initialsData.videoTagsComponent?.videoId?.toString() ||
      initialsData.xplayerSettings?.videoId?.toString() ||
      videoIdentifier.replace(/\D/g, '') ||
      '0';

    // 10. Related videos
    const relatedCards = parseCardsFromHtml(html);

    const finalThumbnail =
      thumbnail ||
      (matchedSeed ? matchedSeed.thumbnail : generateUniqueVideoPoster(videoId, title || 'Video'));

    return {
      id: videoId,
      title: title || 'Streaming Video',
      url: targetUrl,
      thumbnail: finalThumbnail,
      previewVideo: mp4Urls[0] || undefined,
      m3u8Url: m3u8Url || undefined,
      mp4Urls,
      duration,
      durationSeconds: durationSec,
      views: '500K views',
      rating,
      likes,
      dislikes,
      uploader: uploader || 'Verified Creator',
      uploaderSubscribers: 15400,
      categories: categories.length > 0 ? categories : ['Featured', 'HD Videos', 'Premium'],
      tags: tags.length > 0 ? tags : ['HD', 'Full Video', 'Top Quality'],
      relatedVideos: relatedCards.length > 0 ? relatedCards.slice(0, 12) : SEED_VIDEOS,
    };
  } catch (err) {
    console.error(`Error scraping video details for ${videoIdentifier}:`, err);
    return matchedSeed ? { ...matchedSeed, relatedVideos: SEED_VIDEOS.filter(v => v.id !== matchedSeed.id) } : SEED_VIDEOS[0];
  }
}
