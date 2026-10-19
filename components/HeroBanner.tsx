'use client';

import React, { useState, useEffect } from 'react';
import { Play, Plus, Check, Star, Eye, Clock, Sparkles } from 'lucide-react';
import { VideoItem, formatDuration, generateUniqueVideoPoster } from '@/lib/player-utils';

interface HeroBannerProps {
  video: VideoItem;
  onPlay: (video: VideoItem) => void;
  isFavorite: boolean;
  onToggleFavorite: (video: VideoItem) => void;
}

export default function HeroBanner({
  video,
  onPlay,
  isFavorite,
  onToggleFavorite,
}: HeroBannerProps) {
  const [failedThumb, setFailedThumb] = useState<string | null>(null);
  const [triedProxy, setTriedProxy] = useState(false);

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

  return (
    <div className="relative w-full h-[380px] sm:h-[460px] lg:h-[520px] rounded-2xl overflow-hidden bg-[#17171D] border border-white/10 group mb-8">
      {/* Background Media with Dark Gradient Scrims */}
      <div className="absolute inset-0">
        <img
          src={displaySrc}
          alt={video.title}
          referrerPolicy="no-referrer"
          onError={handleImageError}
          className="w-full h-full object-cover object-center transform scale-105 group-hover:scale-100 transition-transform duration-700 opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0F] via-[#0B0B0F]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0F] via-[#0B0B0F]/80 to-transparent" />
      </div>

      {/* Content Container */}
      <div className="relative h-full max-w-7xl mx-auto px-6 sm:px-10 flex flex-col justify-end pb-8 sm:pb-12 z-10">
        {/* Featured Tag (Unboxed typography) */}
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#E50914] mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Featured Spotlight</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white max-w-3xl leading-tight line-clamp-2 text-balance mb-3">
          {video.title}
        </h1>

        {/* Unboxed Metadata (Zero-pill discipline) */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm text-slate-300 mb-6 font-medium">
          <span className="text-white font-semibold flex items-center gap-1">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>{video.rating || 98}% Approval</span>
          </span>
          <span aria-hidden="true" className="text-slate-500">·</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{video.duration || '15:00'}</span>
          </span>
          <span aria-hidden="true" className="text-slate-500">·</span>
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>{video.views || '500K views'}</span>
          </span>
          {video.uploader && (
            <>
              <span aria-hidden="true" className="text-slate-500">·</span>
              <span className="text-slate-300">{video.uploader}</span>
            </>
          )}
        </div>

        {/* Categories unboxed list */}
        {video.categories && video.categories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-6">
            {video.categories.slice(0, 4).map((cat, idx) => (
              <React.Fragment key={cat}>
                <span>{cat}</span>
                {idx < Math.min(video.categories!.length - 1, 3) && (
                  <span aria-hidden="true" className="text-slate-600">·</span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* CTAs */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onPlay(video)}
            className="min-h-[48px] px-7 py-3 rounded-xl bg-[#E50914] hover:bg-[#c20711] text-white font-bold text-sm flex items-center gap-2.5 transition-all shadow-lg shadow-[#E50914]/30 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Watch Now</span>
          </button>

          <button
            onClick={() => onToggleFavorite(video)}
            className={`min-h-[48px] px-5 py-3 rounded-xl border flex items-center gap-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
              isFavorite
                ? 'bg-white/20 border-white text-white'
                : 'bg-white/10 hover:bg-white/15 border-white/20 text-slate-200'
            }`}
            aria-label={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
          >
            {isFavorite ? <Check className="w-4 h-4 text-emerald-400" /> : <Plus className="w-4 h-4" />}
            <span>{isFavorite ? 'In Favorites' : 'My List'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
