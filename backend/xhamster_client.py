"""
xHamster API Client for NitePlay FastAPI Backend.
Integrates the provided scraper logic to fetch real videos, search, and streaming URLs.
"""
from __future__ import annotations

import os
import re
import json
import logging
import asyncio
from dataclasses import dataclass
from typing import Optional, List, Dict, Any
from urllib.parse import quote, urlencode

# Setup logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("NitePlay-Backend")

REGEX_M3U8 = re.compile(r'https?:(?:\\\/|\/)[^"\'\s<>]+\.m3u8[^"\'\s<>]*')
REGEX_THUMBNAIL = re.compile(r'property=["\']og:image["\'] content=["\']([^"\']+)["\']')
REGEX_AUTHOR = re.compile(r'href=["\']https://xhamster\.com/channels/([^"\']+)["\']')

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Cookie": "cookie_accept_v2=%7B%22e%22%3A1%2C%22f%22%3A1%2C%22t%22%3A1%2C%22a%22%3A1%7D; age_confirmed=1",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

@dataclass
class VideoItemModel:
    id: str
    title: str
    url: str
    thumbnail: str
    duration: str
    views: str
    rating: int
    uploader: str
    preview_video: Optional[str] = None
    m3u8_url: Optional[str] = None
    categories: Optional[List[str]] = None
    tags: Optional[List[str]] = None

class XHamsterClient:
    def __init__(self):
        self.session_headers = HEADERS

    async def fetch_html(self, url: str) -> str:
        """Asynchronously fetches page content via curl or urllib."""
        def _fetch():
            import urllib.request
            req = urllib.request.Request(url, headers=self.session_headers)
            with urllib.request.urlopen(req, timeout=12) as resp:
                return resp.read().decode("utf-8", errors="ignore")
        return await asyncio.to_thread(_fetch)

    def parse_video_cards(self, html: str) -> List[VideoItemModel]:
        """Parses video cards from HTML using resilient regex patterns."""
        cards = []
        pattern = re.compile(r'<div[^>]*data-video-id=["\'](\d+)["\'][^>]*>(.*?)(?=<div[^>]*data-video-id|$)', re.DOTALL)
        for match in pattern.finditer(html):
            vid_id = match.group(1)
            content = match.group(2)

            # Title
            t_m = re.search(r'aria-label=["\']([^"\']+)["\']', content) or re.search(r'title=["\']([^"\']+)["\']', content)
            title = t_m.group(1).strip() if t_m else f"Video {vid_id}"

            # URL
            u_m = re.search(r'href=["\'](https://xhamster\.com/videos/[^"\']+)["\']', content)
            video_url = u_m.group(1) if u_m else f"https://xhamster.com/videos/{vid_id}"

            # Thumbnail
            img_m = re.search(r'<img[^>]*src=["\'](https:[^"\']+)["\']', content) or re.search(r'srcset=["\'](https:[^"\'\s]+)', content)
            thumb = img_m.group(1) if img_m else ""

            # Preview MP4
            prev_m = re.search(r'data-previewvideo-fallback=["\'](https:[^"\']+)["\']', content) or re.search(r'data-previewvideo=["\'](https:[^"\']+)["\']', content)
            preview = prev_m.group(1) if prev_m else None

            # Duration
            d_m = re.search(r'([0-9]{1,2}:[0-9]{2})', content)
            duration = d_m.group(1) if d_m else "10:00"

            # Views
            v_m = re.search(r'video-thumb-views[^>]*>([^<]+)<', content)
            views = v_m.group(1).strip() if v_m else "100K views"

            # Uploader
            up_m = re.search(r'video-uploader__name[^>]*>([^<]+)<', content)
            uploader = re.sub(r'<!--.*?-->', '', up_m.group(1)).strip() if up_m else "Creator"

            # Rating
            r_m = re.search(r'(\d+)%', content)
            rating = int(r_m.group(1)) if r_m else 95

            cards.append(VideoItemModel(
                id=vid_id,
                title=title,
                url=video_url,
                thumbnail=thumb,
                duration=duration,
                views=views,
                rating=rating,
                uploader=uploader,
                preview_video=preview
            ))
        return cards

    async def get_videos(self, category: Optional[str] = None, page: int = 1, sort: str = "best") -> List[VideoItemModel]:
        """Fetches videos from category or homepage."""
        if category:
            base_url = f"https://xhamster.com/search/{quote(category)}"
            if page > 1:
                base_url += f"/{page}"
            target = f"{base_url}?quality=720p&sort={sort}"
        else:
            if sort == "newest":
                target = f"https://xhamster.com/newest/{page}" if page > 1 else "https://xhamster.com/newest"
            else:
                target = f"https://xhamster.com/best/{page}" if page > 1 else "https://xhamster.com/best"

        html = await self.fetch_html(target)
        return self.parse_video_cards(html)

    async def search(self, query: str, quality: str = "720p", sort: Optional[str] = None, category: Optional[str] = None, page: int = 1) -> List[VideoItemModel]:
        """Searches videos with filters and pagination."""
        path = quote(query.strip() or "all", safe="")
        url = f"https://xhamster.com/search/{path}"
        if page > 1:
            url += f"/{page}"

        params = {}
        if quality:
            params["quality"] = quality
        if sort:
            params["sort"] = sort
        if category:
            params["cats"] = category

        qs = urlencode(params)
        final_url = f"{url}?{qs}" if qs else url
        html = await self.fetch_html(final_url)
        return self.parse_video_cards(html)

    async def get_video_details(self, video_id_or_url: str) -> Dict[str, Any]:
        """Scrapes full video metadata and streaming URLs."""
        if video_id_or_url.startswith("http"):
            url = video_id_or_url
        else:
            url = f"https://xhamster.com/videos/{video_id_or_url}"

        html = await self.fetch_html(url)

        # M3U8
        m3u8_m = REGEX_M3U8.search(html)
        m3u8_url = m3u8_m.group(0).replace(r"\/", "/") if m3u8_m else None

        # Direct MP4s
        mp4s = [u.replace(r"\/", "/") for u in re.findall(r'https?:(?:\\\/|\/)[^"\'\s<>]+\.mp4[^"\'\s<>]*', html)]

        # Title
        t_m = re.search(r'property=["\']og:title["\'] content=["\']([^"\']+)["\']', html)
        title = t_m.group(1).replace(" - xHamster", "").strip() if t_m else "Video"

        # Image
        img_m = REGEX_THUMBNAIL.search(html)
        thumbnail = img_m.group(1) if img_m else ""

        # Initials JSON
        initials_data = {}
        idx = html.find("window.initials=")
        if idx != -1:
            end = html.find(";</script>", idx)
            if end != -1:
                try:
                    initials_data = json.loads(html[idx + len("window.initials="):end])
                except Exception:
                    pass

        rating_model = initials_data.get("ratingComponent", {}).get("ratingModel", {})
        tags_model = initials_data.get("videoTagsComponent", {}).get("tags", [])
        categories = [t["name"] for t in tags_model if t.get("isCategory")]
        tags = [t["name"] for t in tags_model if t.get("isTag")]
        uploader = next((t["name"] for t in tags_model if t.get("isUser")), "Verified Creator")

        related = self.parse_video_cards(html)[:8]

        return {
            "id": video_id_or_url,
            "title": title,
            "url": url,
            "thumbnail": thumbnail,
            "m3u8_url": m3u8_url,
            "mp4_urls": mp4s[:5],
            "rating": rating_model.get("value", 95),
            "likes": rating_model.get("likes", 1000),
            "dislikes": rating_model.get("dislikes", 20),
            "categories": categories,
            "tags": tags,
            "uploader": uploader,
            "related_videos": [c.__dict__ for c in related],
        }
