'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, SlidersHorizontal, Loader2, AlertCircle } from 'lucide-react';
import { VideoItem } from '@/lib/player-utils';
import { POPULAR_CATEGORIES } from '@/lib/scraper';
import VideoCard from './VideoCard';

interface SearchFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVideo: (video: VideoItem) => void;
  favorites: Set<string>;
  onToggleFavorite: (video: VideoItem) => void;
  initialQuery?: string;
}

export default function SearchFilterDrawer({
  isOpen,
  onClose,
  onSelectVideo,
  favorites,
  onToggleFavorite,
  initialQuery = '',
}: SearchFilterDrawerProps) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('best');
  const [quality, setQuality] = useState<string>('720p');
  const [minDuration, setMinDuration] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const executeSearch = useCallback(
    async (
      q: string,
      p: number,
      cat: string,
      sort: string,
      qual: string,
      dur: string,
      append = false
    ) => {
      setLoading(true);
      setHasSearched(true);
      try {
        const params = new URLSearchParams();
        if (q.trim()) params.set('q', q.trim());
        if (cat) params.set('category', cat);
        if (sort) params.set('sort', sort);
        if (qual) params.set('quality', qual);
        if (dur) params.set('minDuration', dur);
        params.set('page', p.toString());

        const res = await fetch(`/api/search?${params.toString()}`);
        const data = await res.json();
        if (data.success && data.videos) {
          if (append) {
            setVideos((prev) => [...prev, ...data.videos]);
          } else {
            setVideos(data.videos);
          }
        }
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (initialQuery) {
      executeSearch(initialQuery, 1, category, sortBy, quality, minDuration);
    }
  }, [initialQuery, executeSearch, category, sortBy, quality, minDuration]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    executeSearch(query, 1, category, sortBy, quality, minDuration);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    executeSearch(query, nextPage, category, sortBy, quality, minDuration, true);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search and filter videos"
      className="fixed inset-0 z-50 bg-[#0B0B0F]/95 backdrop-blur-xl overflow-y-auto animate-fade-in"
    >
      <div className="max-w-6xl mx-auto min-h-screen px-4 sm:px-6 py-4 sm:py-6 flex flex-col">
        {/* Search Header Bar */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <form onSubmit={handleFormSubmit} className="flex-1 relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search adult videos, categories, tags, creators..."
              autoFocus
              className="w-full min-h-[48px] pl-12 pr-10 py-3 rounded-2xl bg-[#17171D] border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] transition-colors"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-white"
                aria-label="Clear search input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Toggle Filters Drawer */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`min-h-[48px] min-w-[48px] px-3.5 py-2 rounded-2xl border flex items-center gap-2 text-xs font-semibold transition-colors focus:outline-none ${
              showFilters || category || minDuration
                ? 'bg-[#E50914] text-white border-[#E50914]'
                : 'bg-[#17171D] hover:bg-white/10 text-slate-200 border-white/10'
            }`}
            aria-label="Toggle Filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>

          {/* Close Search */}
          <button
            onClick={onClose}
            className="min-h-[48px] min-w-[48px] p-2.5 rounded-2xl bg-[#17171D] hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 flex items-center justify-center transition-colors focus:outline-none"
            aria-label="Close Search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls Row (Expandable) */}
        {showFilters && (
          <div className="bg-[#17171D] border border-white/10 rounded-2xl p-4 sm:p-6 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-in">
            {/* Sort By */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-[#0B0B0F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E50914]"
              >
                <option value="best">Most Relevant / Best</option>
                <option value="views">Most Viewed</option>
                <option value="newest">Recently Added</option>
                <option value="longest">Longest Duration</option>
              </select>
            </div>

            {/* Quality */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Minimum Quality
              </label>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                className="w-full bg-[#0B0B0F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E50914]"
              >
                <option value="720p">HD (720p+)</option>
                <option value="1080p">Full HD (1080p+)</option>
                <option value="2160p">4K UHD (2160p)</option>
              </select>
            </div>

            {/* Min Duration */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Duration
              </label>
              <select
                value={minDuration}
                onChange={(e) => setMinDuration(e.target.value)}
                className="w-full bg-[#0B0B0F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E50914]"
              >
                <option value="">Any Length</option>
                <option value="2">2+ Minutes</option>
                <option value="10">10+ Minutes</option>
                <option value="30">30+ Minutes</option>
                <option value="40">40+ Minutes (Full Length)</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#0B0B0F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E50914]"
              >
                <option value="">All Categories</option>
                {POPULAR_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Search Results Area */}
        {loading && videos.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-10 h-10 text-[#E50914] animate-spin mb-3" />
            <p className="text-sm font-medium">Searching live streaming catalog...</p>
          </div>
        ) : videos.length > 0 ? (
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-400">
                Found {videos.length} videos {query ? `for "${query}"` : ''}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              {videos.map((vid) => (
                <VideoCard
                  key={vid.id}
                  video={vid}
                  onSelect={(v) => {
                    onSelectVideo(v);
                    onClose();
                  }}
                  isFavorite={favorites.has(vid.id)}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </div>

            {/* Load More Button */}
            <div className="flex justify-center pb-12">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="min-h-[48px] px-8 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/15 transition-all flex items-center gap-2 focus:outline-none disabled:opacity-50"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin text-[#E50914]" />}
                <span>Load More Videos (Page {page + 1})</span>
              </button>
            </div>
          </div>
        ) : hasSearched ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center text-slate-400">
            <AlertCircle className="w-12 h-12 text-slate-500 mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">No videos found</h3>
            <p className="text-xs max-w-sm">
              Try searching with broader terms or adjusting your quality and category filters.
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center text-slate-400">
            <Search className="w-12 h-12 text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-slate-300 mb-1">
              Search NitePlay
            </h3>
            <p className="text-xs max-w-sm text-slate-500">
              Type keywords above to discover high-definition streaming titles, creators, and full-length scenes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
