'use client';

import React from 'react';
import { POPULAR_CATEGORIES, PopularCategory } from '@/lib/scraper';

interface CategoryPillsProps {
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export default function CategoryPills({
  selectedCategory,
  onSelectCategory,
}: CategoryPillsProps) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
        <button
          onClick={() => onSelectCategory(null)}
          className={`min-h-[40px] px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all border shrink-0 ${
            selectedCategory === null
              ? 'bg-[#E50914] text-white border-[#E50914] shadow-md shadow-[#E50914]/25'
              : 'bg-[#17171D] hover:bg-white/10 text-slate-300 hover:text-white border-white/10'
          }`}
        >
          All Categories
        </button>

        {POPULAR_CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`min-h-[40px] px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all border shrink-0 flex items-center gap-2 ${
                isActive
                  ? 'bg-[#E50914] text-white border-[#E50914] shadow-md shadow-[#E50914]/25'
                  : 'bg-[#17171D] hover:bg-white/10 text-slate-300 hover:text-white border-white/10'
              }`}
            >
              <span>{cat.name}</span>
              {cat.videoCount && (
                <span className={`text-[10px] font-normal ${isActive ? 'text-white/80' : 'text-slate-400'}`}>
                  {cat.videoCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
