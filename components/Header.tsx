'use client';

import React from 'react';
import { Search, Flame, Bookmark, Compass, ShieldOff, Play } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenSearch: () => void;
  favoritesCount: number;
}

export default function Header({
  currentTab,
  onTabChange,
  onOpenSearch,
  favoritesCount,
}: HeaderProps) {
  const handleQuickExit = () => {
    // Discreet emergency exit
    window.location.replace('https://www.google.com');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0B0B0F]/95 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6 sm:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => onTabChange('home')}
          className="flex items-center gap-2 text-left group focus:outline-none shrink-0"
          aria-label="NitePlay Home"
        >
          <div className="w-8 h-8 rounded-lg bg-[#E50914] flex items-center justify-center text-white shadow-md shadow-[#E50914]/30 group-hover:scale-105 transition-transform">
            <Play className="w-4 h-4 fill-white translate-x-0.5" />
          </div>
          <span className="text-xl font-black tracking-tight text-white">
            Nite<span className="text-[#E50914]">Play</span>
          </span>
        </button>

        {/* Zone 2: Navigation Links (Clean single-line text links) */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <button
            onClick={() => onTabChange('home')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              currentTab === 'home'
                ? 'text-[#E50914] font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => onTabChange('trending')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              currentTab === 'trending'
                ? 'text-[#E50914] font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Trending
          </button>
          <button
            onClick={() => onTabChange('categories')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              currentTab === 'categories'
                ? 'text-[#E50914] font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Categories
          </button>
          <button
            onClick={() => onTabChange('library')}
            className={`whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-colors ${
              currentTab === 'library'
                ? 'text-[#E50914] font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>Library</span>
            {favoritesCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#E50914] text-white">
                {favoritesCount}
              </span>
            )}
          </button>
        </nav>

        {/* Zone 3: Search Trigger & Quick Exit */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenSearch}
            className="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 flex items-center gap-2 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E50914]"
            aria-label="Open Video Search"
          >
            <Search className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Search videos...</span>
          </button>

          <button
            onClick={handleQuickExit}
            title="Emergency Quick Exit (redirect to Google)"
            aria-label="Quick Exit"
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-white/5 hover:bg-red-950/40 text-slate-400 hover:text-red-400 border border-white/10 flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <ShieldOff className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
