'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Heart, Star, Clock, Eye } from 'lucide-react';
import { VideoItem, generateUniqueVideoPoster } from '@/lib/player-utils';

interface VideoCardProps {
  video: VideoItem;
  onSelect: (video: VideoItem) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (video: VideoItem) => void;
  progressPercent?: number;
}

export default function VideoCard({
  video,
  onSelect,
  isFavorite = false,
  onToggleFavorite,
  progressPercent,
}: VideoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [failedThumb, setFailedThumb] = useState<string | null>(null);
  const [triedProxy, setTriedProxy] = useState(false);

  // If thumbnail prop changes, adjust state during render (standard React pattern)
  const [prevThumb, setPrevThumb] = useState(video.thumbnail);
  if (video.thumbnail !== prevThumb) {
    setPrevThumb(video.thumbnail);
    setFailedThumb(null);
    setTriedProxy(false);
  }

  let displaySrc = video.thumbnail;
  if (failedThumb === video.thumbnail) {
    if (triedProxy) {
      displaySrc = generateUniqueVideoPoster(video.id, video.title);
    } else {
      displaySrc = `/api/proxy/image?url=${encodeURIComponent(video.thumbnail)}`;
    }
  }

  const handleImageError = () => {
    if (!triedProxy && video.thumbnail && video.thumbnail.startsWith('http')) {
      setTriedProxy(true);
      setFailedThumb(video.thumbnail);
    } else {
      setTriedProxy(true);
      setFailedThumb(video.thumbnail);
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (video.previewVideo && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {
        // autoplay may be restricted
      });
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  return (
    <div
      className="group relative flex flex-col bg-[#17171D] rounded-xl overflow-hidden border border-white/5 hover:border-white/20 transition-all duration-300 hover:shadow-xl hover:shadow-black/50"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Thumbnail & Preview Video Container */}
      <div
        onClick={() => onSelect(video)}
        className="relative aspect-video w-full overflow-hidden bg-black/60 cursor-pointer"
      >
        {/* Poster Image */}
        <img
          src={displaySrc}
          alt={video.title}
          referrerPolicy="no-referrer"
          loading="lazy"
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            isHovered && video.previewVideo && videoLoaded ? 'opacity-0' : 'opacity-100'
          }`}
          onError={handleImageError}
        />

        {/* Dynamic Video Preview on Hover */}
        {video.previewVideo && (
          <video
            ref={videoRef}
            src={video.previewVideo}
            muted
            loop
            playsInline
            onLoadedData={() => setVideoLoaded(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 pointer-events-none ${
              isHovered && videoLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        {/* Hover overlay with center play icon */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-[#E50914] text-white flex items-center justify-center shadow-lg shadow-[#E50914]/40 transform scale-75 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 fill-white translate-x-0.5" />
          </div>
        </div>

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[11px] font-semibold text-white pointer-events-none">
          {video.duration || '10:00'}
        </div>

        {/* Favorite button in top-right */}
        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(video);
            }}
            className={`absolute top-2 right-2 min-h-[36px] min-w-[36px] p-2 rounded-lg backdrop-blur-md transition-colors focus:outline-none ${
              isFavorite
                ? 'bg-[#E50914] text-white'
                : 'bg-black/60 text-white/70 hover:text-white hover:bg-black/90'
            }`}
            aria-label={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-white' : ''}`} />
          </button>
        )}

        {/* Progress Bar (Continue Watching) */}
        {progressPercent !== undefined && progressPercent > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div
              className="h-full bg-[#E50914] transition-all"
              style={{ width: `${Math.min(100, progressPercent)}%` }}
            />
          </div>
        )}
      </div>

      {/* Video Info Section */}
      <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between">
        <h3
          onClick={() => onSelect(video)}
          title={video.title}
          className="text-sm font-semibold text-slate-100 group-hover:text-white line-clamp-2 leading-snug cursor-pointer mb-2"
        >
          {video.title}
        </h3>

        {/* Unboxed Metadata Line (Zero-pill discipline) */}
        <div className="flex items-center justify-between text-xs text-slate-400 mt-auto pt-1 font-medium">
          <div className="flex items-center gap-1.5 truncate">
            <span className="truncate max-w-[110px] text-slate-300">
              {video.uploader || 'Creator'}
            </span>
            <span aria-hidden="true">·</span>
            <span>{video.views || '100K'}</span>
          </div>

          {video.rating !== undefined && (
            <div className="flex items-center gap-1 text-slate-300 shrink-0">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{video.rating}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
