'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Plus,
  Check,
  Star,
  Eye,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Pause,
} from 'lucide-react';
import { VideoItem, generateUniqueVideoPoster, deduplicateVideos } from '@/lib/player-utils';

interface HeroBannerProps {
  videos?: VideoItem[];
  video?: VideoItem;
  onPlay: (video: VideoItem) => void;
  isFavorite: (videoId: string) => boolean;
  onToggleFavorite: (video: VideoItem) => void;
}

export default function HeroBanner({
  videos = [],
  video,
  onPlay,
  isFavorite,
  onToggleFavorite,
}: HeroBannerProps) {
  // Deduplicate and filter featured carousel items (aiming for 5 to 8 unique videos)
  const featuredList = React.useMemo(() => {
    const raw = videos.length > 0 ? videos : video ? [video] : [];
    const deduped = deduplicateVideos(raw);
    return deduped.slice(0, 8);
  }, [videos, video]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPausedByUser, setIsPausedByUser] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });
  const [failedThumbnails, setFailedThumbnails] = useState<Record<string, boolean>>({});

  const touchStartXRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check user prefers-reduced-motion listener
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      const handleChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches);
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);


  // Safe navigation helpers
  const totalSlides = featuredList.length;

  const goToSlide = useCallback((index: number) => {
    if (totalSlides === 0) return;
    const target = (index + totalSlides) % totalSlides;
    setCurrentIndex(target);
  }, [totalSlides]);

  const handleNext = useCallback(() => {
    goToSlide(currentIndex + 1);
  }, [currentIndex, goToSlide]);

  const handlePrev = useCallback(() => {
    goToSlide(currentIndex - 1);
  }, [currentIndex, goToSlide]);

  // Auto rotation every 6 seconds (paused if hovered, focused, user paused, or prefers-reduced-motion)
  useEffect(() => {
    if (totalSlides <= 1 || isPausedByUser || isHovered || isFocused || prefersReducedMotion) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, 6000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [totalSlides, isPausedByUser, isHovered, isFocused, prefersReducedMotion]);

  // Touch swipe support for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext(); // swipe left
      } else {
        handlePrev(); // swipe right
      }
    }
  };

  if (totalSlides === 0) return null;

  const currentVideo = featuredList[currentIndex] || featuredList[0];
  const isCurrentFav = isFavorite(currentVideo.id);

  const isFailed = failedThumbnails[currentVideo.id];
  const displaySrc = isFailed
    ? generateUniqueVideoPoster(currentVideo.id, currentVideo.title)
    : currentVideo.thumbnail;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured Videos"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-[400px] sm:h-[480px] lg:h-[540px] rounded-2xl overflow-hidden bg-[#17171D] border border-white/10 group mb-10 select-none"
    >
      {/* Background Media with Seamless Gradient Overlays */}
      <div className="absolute inset-0 transition-opacity duration-700">
        <img
          key={currentVideo.id}
          src={displaySrc}
          alt={currentVideo.title}
          referrerPolicy="no-referrer"
          onError={() => {
            setFailedThumbnails((prev) => ({ ...prev, [currentVideo.id]: true }));
          }}
          className="w-full h-full object-cover object-center transform scale-105 group-hover:scale-100 transition-transform duration-1000 opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0F] via-[#0B0B0F]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0F] via-[#0B0B0F]/85 to-transparent sm:w-3/4" />
      </div>

      {/* Slide Navigation Arrows */}
      {totalSlides > 1 && (
        <>
          <button
            onClick={handlePrev}
            aria-label="Previous slide"
            className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 min-h-[44px] min-w-[44px] p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white border border-white/15 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100 focus:outline-none"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            aria-label="Next slide"
            className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 min-h-[44px] min-w-[44px] p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white border border-white/15 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100 focus:outline-none"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Content Container */}
      <div className="relative h-full max-w-7xl mx-auto px-6 sm:px-12 flex flex-col justify-end pb-8 sm:pb-12 z-10">
        {/* Featured Tag and Auto-rotate Controls */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#E50914]">
            <Sparkles className="w-4 h-4" />
            <span>Featured Spotlight #{currentIndex + 1}</span>
          </div>

          {/* Pause / Resume Rotation Control */}
          {totalSlides > 1 && (
            <button
              onClick={() => setIsPausedByUser(!isPausedByUser)}
              aria-label={isPausedByUser ? 'Resume carousel' : 'Pause carousel'}
              className="px-2.5 py-1 rounded-lg bg-black/50 hover:bg-black/80 border border-white/10 text-white/70 hover:text-white text-[11px] font-semibold flex items-center gap-1.5 backdrop-blur-sm transition-colors focus:outline-none"
            >
              {isPausedByUser ? (
                <>
                  <Play className="w-3 h-3 fill-white" />
                  <span className="hidden sm:inline">Resume</span>
                </>
              ) : (
                <>
                  <Pause className="w-3 h-3" />
                  <span className="hidden sm:inline">Pause</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white max-w-3xl leading-tight line-clamp-2 text-balance mb-3 drop-shadow-md">
          {currentVideo.title}
        </h1>

        {/* Metadata Line */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm text-slate-300 mb-6 font-medium">
          <span className="text-white font-semibold flex items-center gap-1">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>{currentVideo.rating || 98}% Approval</span>
          </span>
          <span aria-hidden="true" className="text-slate-500">·</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{currentVideo.duration || '15:00'}</span>
          </span>
          <span aria-hidden="true" className="text-slate-500">·</span>
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>{currentVideo.views || '500K views'}</span>
          </span>
          {currentVideo.uploader && (
            <>
              <span aria-hidden="true" className="text-slate-500">·</span>
              <span className="text-slate-300">{currentVideo.uploader}</span>
            </>
          )}
        </div>

        {/* Categories unboxed list */}
        {currentVideo.categories && currentVideo.categories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-6">
            {currentVideo.categories.slice(0, 4).map((cat, idx) => (
              <React.Fragment key={cat}>
                <span>{cat}</span>
                {idx < Math.min(currentVideo.categories!.length - 1, 3) && (
                  <span aria-hidden="true" className="text-slate-600">·</span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Actions & Pagination Indicators */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onPlay(currentVideo)}
              className="min-h-[48px] px-7 py-3 rounded-xl bg-[#E50914] hover:bg-[#c20711] text-white font-bold text-sm flex items-center gap-2.5 transition-all shadow-lg shadow-[#E50914]/30 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Watch Now</span>
            </button>

            <button
              onClick={() => onToggleFavorite(currentVideo)}
              className={`min-h-[48px] px-5 py-3 rounded-xl border flex items-center gap-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                isCurrentFav
                  ? 'bg-white/20 border-white text-white'
                  : 'bg-white/10 hover:bg-white/15 border-white/20 text-slate-200'
              }`}
              aria-label={isCurrentFav ? 'Remove from Favorites' : 'Add to Favorites'}
            >
              {isCurrentFav ? <Check className="w-4 h-4 text-emerald-400" /> : <Plus className="w-4 h-4" />}
              <span>{isCurrentFav ? 'In Favorites' : 'My List'}</span>
            </button>
          </div>

          {/* Synchronized Pagination Dots */}
          {totalSlides > 1 && (
            <div className="flex items-center gap-2 py-2">
              {featuredList.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => goToSlide(idx)}
                  aria-label={`Go to slide ${idx + 1}: ${item.title}`}
                  className={`h-2.5 rounded-full transition-all focus:outline-none ${
                    currentIndex === idx
                      ? 'w-8 bg-[#E50914] shadow-md shadow-[#E50914]/50'
                      : 'w-2.5 bg-white/30 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
