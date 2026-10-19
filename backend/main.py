"""
NitePlay FastAPI Server
Exposes REST API for video streaming, search, categories, and video details.
"""
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from xhamster_client import XHamsterClient

app = FastAPI(title="NitePlay API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = XHamsterClient()

@app.get("/")
def read_root():
    return {"status": "ok", "app": "NitePlay Adult Video Streaming API", "version": "1.0.0"}

@app.get("/api/videos")
async def list_videos(
    category: Optional[str] = Query(None, description="Category filter"),
    page: int = Query(1, ge=1, description="Page number"),
    sort: str = Query("best", description="Sort order: best, newest, views")
):
    try:
        videos = await client.get_videos(category=category, page=page, sort=sort)
        return {"success": True, "page": page, "count": len(videos), "videos": [v.__dict__ for v in videos]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/search")
async def search_videos(
    q: str = Query(..., description="Search query"),
    quality: str = Query("720p", description="Minimum quality"),
    sort: Optional[str] = Query(None, description="Sort order"),
    category: Optional[str] = Query(None, description="Category"),
    page: int = Query(1, ge=1, description="Page number")
):
    try:
        videos = await client.search(query=q, quality=quality, sort=sort, category=category, page=page)
        return {"success": True, "query": q, "page": page, "count": len(videos), "videos": [v.__dict__ for v in videos]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/videos/{video_id}")
async def get_video(video_id: str):
    try:
        details = await client.get_video_details(video_id)
        return {"success": True, "video": details}
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Video not found or failed to parse: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
