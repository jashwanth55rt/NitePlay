'use client';

import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import VideoCard from './VideoCard';
import { VideoItem } from '@/lib/player-utils';

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

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -380 : 380;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  if (!videos || videos.length === 0) return null;

  return (
    <section className="mb-10 w-full">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          {title}
        </h2>

        <div className="flex items-center gap-2">
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="text-xs font-semibold text-[#E50914] hover:underline mr-2"
            >
              Explore All
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={() => scroll('left')}
              aria-label={`Scroll ${title} left`}
              className="min-h-[36px] min-w-[36px] p-2 rounded-lg bg-[#17171D] hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 flex items-center justify-center transition-colors focus:outline-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              aria-label={`Scroll ${title} right`}
              className="min-h-[36px] min-w-[36px] p-2 rounded-lg bg-[#17171D] hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 flex items-center justify-center transition-colors focus:outline-none"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Slider Carousel Container */}
      <div
        ref={scrollRef}
        className="flex items-stretch gap-4 overflow-x-auto pb-4 pt-1 px-1 scrollbar-none scroll-smooth snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {videos.map((video) => (
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
