'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import VideoCard from './VideoCard';
import { VideoItem, deduplicateVideos } from '@/lib/player-utils';

interface HorizontalSliderProps {
  title: string;
  videos: VideoItem[];
  onSelectVideo: (video: VideoItem) => void;
  favorites?: Set<string>;
  onToggleFavorite?: (video: VideoItem) => void;
  historyMap?: Map<string, number>;
  onViewAll?: () => void;
}

export default function HorizontalSlider({
  title,
  videos,
  onSelectVideo,
  favorites = new Set(),
  onToggleFavorite,
  historyMap,
  onViewAll,
}: HorizontalSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Deduplicate items to prevent identical video cards in the same slider row
  const cleanVideos = React.useMemo(() => {
    return deduplicateVideos(videos);
  }, [videos]);

  const checkScrollBounds = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atLeft = el.scrollLeft <= 4;
    const atRight = el.scrollLeft + el.clientWidth >= el.scrollWidth - 6;
    setCanScrollLeft(!atLeft);
    setCanScrollRight(!atRight);
  }, []);

  useEffect(() => {
    checkScrollBounds();
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener('scroll', checkScrollBounds, { passive: true });
    window.addEventListener('resize', checkScrollBounds);

    return () => {
      el.removeEventListener('scroll', checkScrollBounds);
      window.removeEventListener('resize', checkScrollBounds);
    };
  }, [checkScrollBounds, cleanVideos]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;

    // Dynamically calculate scroll distance based on container width rather than fixed assumption
    const visibleWidth = el.clientWidth;
    const scrollDistance = Math.max(260, Math.floor(visibleWidth * 0.75));

    el.scrollBy({
      left: direction === 'left' ? -scrollDistance : scrollDistance,
      behavior: 'smooth',
    });
  };

  if (!cleanVideos || cleanVideos.length === 0) return null;

  return (
    <section className="mb-10 w-full overflow-hidden">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          {title}
        </h2>

        <div className="flex items-center gap-2">
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="text-xs font-semibold text-[#E50914] hover:underline mr-2 focus:outline-none"
            >
              Explore All
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              aria-label={`Scroll ${title} left`}
              className={`min-h-[38px] min-w-[38px] p-2 rounded-xl bg-[#17171D] border border-white/10 flex items-center justify-center transition-all focus:outline-none ${
                canScrollLeft
                  ? 'hover:bg-white/10 text-white cursor-pointer'
                  : 'opacity-30 text-slate-500 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              aria-label={`Scroll ${title} right`}
              className={`min-h-[38px] min-w-[38px] p-2 rounded-xl bg-[#17171D] border border-white/10 flex items-center justify-center transition-all focus:outline-none ${
                canScrollRight
                  ? 'hover:bg-white/10 text-white cursor-pointer'
                  : 'opacity-30 text-slate-500 cursor-not-allowed'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Slider Carousel Container with Responsive Snap */}
      <div
        ref={scrollRef}
        className="flex items-stretch gap-4 overflow-x-auto pb-4 pt-1 px-1 scrollbar-none scroll-smooth snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {cleanVideos.map((video) => (
          <div
            key={video.id}
            className="w-[260px] sm:w-[290px] lg:w-[320px] shrink-0 snap-start flex"
          >
            <VideoCard
              video={video}
              onSelect={onSelectVideo}
              isFavorite={favorites.has(video.id)}
              onToggleFavorite={onToggleFavorite}
              progressPercent={historyMap?.get(video.id)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
