'use client';

import React, { useState } from 'react';
import {
  Bookmark,
  History,
  Trash2,
  Shield,
  EyeOff,
  Clock,
  Play,
  AlertTriangle,
  Mail,
  CheckCircle,
} from 'lucide-react';
import { VideoItem, WatchHistoryEntry } from '@/lib/player-utils';
import VideoCard from './VideoCard';

interface LibraryViewProps {
  favorites: VideoItem[];
  watchHistory: WatchHistoryEntry[];
  watchLater?: VideoItem[];
  onSelectVideo: (video: VideoItem, seekTime?: number) => void;
  onRemoveFavorite: (video: VideoItem) => void;
  onClearHistory: () => void;
  onClearFavorites?: () => void;
  onClearAllData?: () => void;
  isHistoryEnabled: boolean;
  onToggleHistoryEnabled: () => void;
}

export default function LibraryView({
  favorites,
  watchHistory,
  watchLater = [],
  onSelectVideo,
  onRemoveFavorite,
  onClearHistory,
  onClearFavorites,
  onClearAllData,
  isHistoryEnabled,
  onToggleHistoryEnabled,
}: LibraryViewProps) {
  const [activeTab, setActiveTab] = useState<'favorites' | 'history' | 'takedown'>('favorites');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showPurgeAllConfirm, setShowPurgeAllConfirm] = useState(false);
  const [takedownUrl, setTakedownUrl] = useState('');
  const [takedownReason, setTakedownReason] = useState('');
  const [takedownSent, setTakedownSent] = useState(false);

  const handleTakedownSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!takedownUrl) return;
    setTakedownSent(true);
    setTimeout(() => {
      setTakedownUrl('');
      setTakedownReason('');
      setTakedownSent(false);
    }, 5000);
  };

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

        {/* Tab switch between Favorites, History, and Compliance */}
        <div className="flex items-center gap-1.5 p-1 bg-[#17171D] rounded-xl border border-white/10 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('favorites')}
            className={`min-h-[38px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
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
            className={`min-h-[38px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-[#E50914] text-white shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History ({watchHistory.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('takedown')}
            className={`min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'takedown'
                ? 'bg-white/20 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Privacy & Takedown</span>
          </button>
        </div>
      </div>

      {/* Privacy banner for history tab */}
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
          <div>
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
          </div>
        ) : (
          <div className="py-20 text-center flex flex-col items-center justify-center text-slate-400">
            <Bookmark className="w-12 h-12 text-slate-600 mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">Your List is Empty</h3>
            <p className="text-xs max-w-sm text-slate-400">
              Click the heart or &quot;+ Add to Library&quot; button on any video card to save your top content here.
            </p>
          </div>
        )
      ) : activeTab === 'history' ? (
        watchHistory.length > 0 ? (
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
        )
      ) : (
        /* Privacy & Takedown Tab */
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Purge All Device Data */}
          <div className="bg-[#17171D] border border-white/10 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-400" />
              <span>Purge All Local Device Data</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Instantly deletes all saved favorites, watch history progress, video playback settings, volume, and verification preferences stored in your browser&apos;s localStorage.
            </p>

            {showPurgeAllConfirm ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (onClearAllData) {
                      onClearAllData();
                    } else {
                      localStorage.clear();
                      window.location.reload();
                    }
                    setShowPurgeAllConfirm(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors"
                >
                  Yes, Delete Everything
                </button>
                <button
                  onClick={() => setShowPurgeAllConfirm(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-slate-300 text-xs font-semibold hover:bg-white/15"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowPurgeAllConfirm(true)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-red-950/40 text-red-400 border border-red-900/50 text-xs font-bold transition-colors"
              >
                Purge All Data & Preferences
              </button>
            )}
          </div>

          {/* DMCA / Content Reporting Form */}
          <div className="bg-[#17171D] border border-white/10 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#E50914]" />
              <span>Content Notice & Takedown Form</span>
            </h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              NitePlay complies with copyright protections and non-consensual content regulations. If you believe any indexed content infringes upon rights or violates safety rules, submit a report below.
            </p>

            {takedownSent ? (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>
                  Report received. Our safety team reviews notices within 24 hours in accordance with 17 U.S.C. § 512(c).
                </span>
              </div>
            ) : (
              <form onSubmit={handleTakedownSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Video URL or ID to Report
                  </label>
                  <input
                    type="text"
                    required
                    value={takedownUrl}
                    onChange={(e) => setTakedownUrl(e.target.value)}
                    placeholder="https://... or Video ID"
                    className="w-full bg-[#0B0B0F] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#E50914]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Reason for Notice
                  </label>
                  <select
                    value={takedownReason}
                    onChange={(e) => setTakedownReason(e.target.value)}
                    className="w-full bg-[#0B0B0F] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#E50914]"
                  >
                    <option value="">Select a reason</option>
                    <option value="copyright">Copyright Infringement (DMCA)</option>
                    <option value="consent">Non-Consensual Imagery</option>
                    <option value="underage">Age / Eligibility Violation</option>
                    <option value="other">Other Terms Violation</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#E50914] hover:bg-[#c20711] text-white text-xs font-bold transition-colors shadow-md shadow-[#E50914]/25"
                >
                  Submit Takedown Request
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
