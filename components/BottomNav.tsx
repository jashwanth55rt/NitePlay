'use client';

import React from 'react';
import { Home, Flame, Search, Bookmark } from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenSearch: () => void;
  favoritesCount: number;
}

export default function BottomNav({
  currentTab,
  onTabChange,
  onOpenSearch,
  favoritesCount,
}: BottomNavProps) {
  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B0B0F]/95 backdrop-blur-lg border-t border-white/10 h-16 px-2 flex items-center justify-around select-none"
    >
      {/* Home */}
      <button
        onClick={() => onTabChange('home')}
        className={`min-h-[44px] min-w-[44px] flex-1 flex flex-col items-center justify-center transition-colors focus:outline-none ${
          currentTab === 'home' ? 'text-[#E50914]' : 'text-slate-400 hover:text-white'
        }`}
        aria-label="Home"
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px] font-medium tracking-tight mt-1">Home</span>
      </button>

      {/* Trending */}
      <button
        onClick={() => onTabChange('trending')}
        className={`min-h-[44px] min-w-[44px] flex-1 flex flex-col items-center justify-center transition-colors focus:outline-none ${
          currentTab === 'trending' ? 'text-[#E50914]' : 'text-slate-400 hover:text-white'
        }`}
        aria-label="Trending"
      >
        <Flame className="w-5 h-5" />
        <span className="text-[10px] font-medium tracking-tight mt-1">Trending</span>
      </button>

      {/* Search */}
      <button
        onClick={onOpenSearch}
        className="min-h-[44px] min-w-[44px] flex-1 flex flex-col items-center justify-center text-slate-400 hover:text-white transition-colors focus:outline-none"
        aria-label="Search"
      >
        <Search className="w-5 h-5" />
        <span className="text-[10px] font-medium tracking-tight mt-1">Search</span>
      </button>

      {/* Library */}
      <button
        onClick={() => onTabChange('library')}
        className={`min-h-[44px] min-w-[44px] flex-1 flex flex-col items-center justify-center relative transition-colors focus:outline-none ${
          currentTab === 'library' ? 'text-[#E50914]' : 'text-slate-400 hover:text-white'
        }`}
        aria-label="Library"
      >
        <div className="relative">
          <Bookmark className="w-5 h-5" />
          {favoritesCount > 0 && (
            <span className="absolute -top-1 -right-2 text-[9px] font-bold px-1 rounded-full bg-[#E50914] text-white">
              {favoritesCount}
            </span>
          )}
        </div>
        <span className="text-[10px] font-medium tracking-tight mt-1">Library</span>
      </button>
    </nav>
  );
}
