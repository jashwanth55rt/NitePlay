'use client';

import React, { useState } from 'react';
import { Bookmark, History, Trash2, Shield, EyeOff, Check, Heart, Play } from 'lucide-react';
import { VideoItem, WatchHistoryEntry } from '@/lib/player-utils';
import VideoCard from './VideoCard';

interface LibraryViewProps {
  favorites: VideoItem[];
  watchHistory: WatchHistoryEntry[];
  onSelectVideo: (video: VideoItem, seekTime?: number) => void;
  onRemoveFavorite: (video: VideoItem) => void;
  onClearHistory: () => void;
  isHistoryEnabled: boolean;
  onToggleHistoryEnabled: () => void;
}

export default function LibraryView({
  favorites,
  watchHistory,
  onSelectVideo,
  onRemoveFavorite,
  onClearHistory,
  isHistoryEnabled,
  onToggleHistoryEnabled,
}: LibraryViewProps) {
  const [activeTab, setActiveTab] = useState<'favorites' | 'history'>('favorites');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-1">
            My Private Library
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Stored locally on this device. No remote accounts or tracking required.
          </p>
        </div>

        {/* Tab switch between Favorites & History */}
        <div className="flex items-center gap-2 p-1 bg-[#17171D] rounded-xl border border-white/10 shrink-0">
          <button
            onClick={() => setActiveTab('favorites')}
            className={`min-h-[38px] px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'favorites'
                ? 'bg-[#E50914] text-white shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Favorites ({favorites.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`min-h-[38px] px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-[#E50914] text-white shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Watch History ({watchHistory.length})</span>
          </button>
        </div>
      </div>

      {/* Privacy settings banner for history tab */}
      {activeTab === 'history' && (
        <div className="bg-[#17171D] border border-white/10 rounded-2xl p-4 sm:p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white mb-0.5">
                Local Privacy Controls
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Watch history is kept strictly in your browser storage. You can pause recording or purge anytime.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Toggle history recording */}
            <button
              onClick={onToggleHistoryEnabled}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
                isHistoryEnabled
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-slate-400'
              }`}
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>{isHistoryEnabled ? 'History Active' : 'History Paused'}</span>
            </button>

            {/* Clear History */}
            {watchHistory.length > 0 && (
              <>
                {showClearConfirm ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onClearHistory();
                        setShowClearConfirm(false);
                      }}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                    >
                      Confirm Clear
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="min-h-[36px] px-2.5 py-1.5 rounded-lg bg-white/10 text-slate-300 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="min-h-[36px] px-3 py-1.5 rounded-lg bg-white/5 hover:bg-red-950/40 text-slate-300 hover:text-red-400 border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Content Grid */}
      {activeTab === 'favorites' ? (
        favorites.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {favorites.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onSelect={(v) => onSelectVideo(v)}
                isFavorite={true}
                onToggleFavorite={onRemoveFavorite}
              />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center flex flex-col items-center justify-center text-slate-400">
            <Bookmark className="w-12 h-12 text-slate-600 mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">Your List is Empty</h3>
            <p className="text-xs max-w-sm text-slate-400">
              Click the heart or &quot;+ Add to Library&quot; icon on any video card to save your top content here.
            </p>
          </div>
        )
      ) : watchHistory.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {watchHistory.map((item) => (
            <div key={item.video.id} className="relative group">
              <VideoCard
                video={item.video}
                onSelect={(v) => onSelectVideo(v, item.currentTime)}
                progressPercent={item.progressPercent}
                isFavorite={favorites.some((f) => f.id === item.video.id)}
                onToggleFavorite={onRemoveFavorite}
              />
              <div className="mt-1 px-1 flex items-center justify-between text-[11px] text-slate-400">
                <span>{item.progressPercent}% watched</span>
                <button
                  onClick={() => onSelectVideo(item.video, item.currentTime)}
                  className="text-[#E50914] font-semibold hover:underline flex items-center gap-1"
                >
                  <Play className="w-2.5 h-2.5 fill-current" />
                  <span>Resume</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center flex flex-col items-center justify-center text-slate-400">
          <History className="w-12 h-12 text-slate-600 mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No Viewing History</h3>
          <p className="text-xs max-w-sm text-slate-400">
            Videos you watch will show here along with your playback position so you can pick up where you left off.
          </p>
        </div>
      )}
    </div>
  );
}
