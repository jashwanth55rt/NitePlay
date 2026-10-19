'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import HeroBanner from '@/components/HeroBanner';
import HorizontalSlider from '@/components/HorizontalSlider';
import CategoryPills from '@/components/CategoryPills';
import VideoCard from '@/components/VideoCard';
import VideoPlayerModal from '@/components/VideoPlayerModal';
import SearchFilterDrawer from '@/components/SearchFilterDrawer';
import BottomNav from '@/components/BottomNav';
import LibraryView from '@/components/LibraryView';
import AgeVerificationModal from '@/components/AgeVerificationModal';
import {
  VideoItem,
  WatchHistoryEntry,
  updateHistoryList,
  getContinueWatchingList,
} from '@/lib/player-utils';
import { SEED_VIDEOS, POPULAR_CATEGORIES } from '@/lib/scraper';
import { Loader2, Flame, Sparkles, RefreshCw, Layers } from 'lucide-react';

export default function HomePage() {
  const [isAgeVerified, setIsAgeVerified] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('niteplay_age_verified') === 'true' ||
        sessionStorage.getItem('niteplay_age_verified') === 'true'
      );
    }
    return false;
  });
  const [activeTab, setActiveTab] = useState<'home' | 'trending' | 'categories' | 'library'>('home');

  // Video feeds
  const [featuredVideo, setFeaturedVideo] = useState<VideoItem>(SEED_VIDEOS[0]);
  const [trendingVideos, setTrendingVideos] = useState<VideoItem[]>([]);
  const [newestVideos, setNewestVideos] = useState<VideoItem[]>([]);
  const [bestVideos, setBestVideos] = useState<VideoItem[]>([]);
  const [categoryVideos, setCategoryVideos] = useState<VideoItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loadingFeeds, setLoadingFeeds] = useState(true);

  // Active player state
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);
  const [playerSeekTime, setPlayerSeekTime] = useState<number>(0);

  // Search drawer state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Local user state (favorites & history)
  const [favorites, setFavorites] = useState<VideoItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedFavs = localStorage.getItem('niteplay_favorites');
        if (savedFavs) return JSON.parse(savedFavs);
      } catch (e) {}
    }
    return [];
  });

  const [watchHistory, setWatchHistory] = useState<WatchHistoryEntry[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedHist = localStorage.getItem('niteplay_watch_history');
        if (savedHist) return JSON.parse(savedHist);
      } catch (e) {}
    }
    return [];
  });

  const [isHistoryEnabled, setIsHistoryEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const histSetting = localStorage.getItem('niteplay_history_enabled');
        if (histSetting !== null) return histSetting === 'true';
      } catch (e) {}
    }
    return true;
  });

  // Fetch initial home, trending, and newest video feeds
  useEffect(() => {
    let isSubscribed = true;

    async function loadFeeds() {
      setLoadingFeeds(true);
      try {
        const [homeRes, newestRes, bestRes] = await Promise.all([
          fetch('/api/videos?type=home'),
          fetch('/api/videos?type=newest'),
          fetch('/api/videos?type=best'),
        ]);

        const [homeData, newestData, bestData] = await Promise.all([
          homeRes.json(),
          newestRes.json(),
          bestRes.json(),
        ]);

        if (isSubscribed) {
          const homeList = homeData.videos?.length ? homeData.videos : SEED_VIDEOS;
          const newestList = newestData.videos?.length ? newestData.videos : SEED_VIDEOS.slice(1);
          const bestList = bestData.videos?.length ? bestData.videos : SEED_VIDEOS;

          setTrendingVideos(homeList);
          setNewestVideos(newestList);
          setBestVideos(bestList);
          setFeaturedVideo(homeList[0] || SEED_VIDEOS[0]);
        }
      } catch (err) {
        console.error('Failed to load initial video feeds:', err);
        if (isSubscribed) {
          setTrendingVideos(SEED_VIDEOS);
          setNewestVideos(SEED_VIDEOS.slice(1));
          setBestVideos(SEED_VIDEOS);
        }
      } finally {
        if (isSubscribed) setLoadingFeeds(false);
      }
    }

    loadFeeds();
    return () => {
      isSubscribed = false;
    };
  }, []);

  // Fetch category videos when category filter changes
  useEffect(() => {
    if (!selectedCategory) return;

    let isSubscribed = true;
    async function loadCategory() {
      try {
        const res = await fetch(`/api/videos?type=category&category=${encodeURIComponent(selectedCategory!)}`);
        const data = await res.json();
        if (isSubscribed && data.success && data.videos) {
          setCategoryVideos(data.videos);
        }
      } catch (e) {
        console.error('Failed to load category videos:', e);
      }
    }

    loadCategory();
    return () => {
      isSubscribed = false;
    };
  }, [selectedCategory]);

  const handleSelectCategory = (cat: string | null) => {
    setSelectedCategory(cat);
    if (!cat) {
      setCategoryVideos([]);
    }
  };

  // Favorite toggle handler
  const handleToggleFavorite = (video: VideoItem) => {
    setFavorites((prev) => {
      const exists = prev.some((v) => v.id === video.id);
      let updated: VideoItem[];
      if (exists) {
        updated = prev.filter((v) => v.id !== video.id);
      } else {
        updated = [video, ...prev];
      }
      try {
        localStorage.setItem('niteplay_favorites', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Watch progress tracker
  const handleUpdateWatchProgress = (video: VideoItem, currentTime: number, duration: number) => {
    if (!isHistoryEnabled || duration <= 0) return;

    const progressPercent = Math.min(100, Math.max(0, Math.round((currentTime / duration) * 100)));
    const newEntry: WatchHistoryEntry = {
      video,
      currentTime,
      duration,
      progressPercent,
      updatedAt: Date.now(),
    };

    setWatchHistory((prev) => {
      const updated = updateHistoryList(prev, newEntry);
      try {
        localStorage.setItem('niteplay_watch_history', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleClearHistory = () => {
    setWatchHistory([]);
    try {
      localStorage.removeItem('niteplay_watch_history');
    } catch (e) {}
  };

  const handleToggleHistoryEnabled = () => {
    setIsHistoryEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('niteplay_history_enabled', String(next));
      } catch (e) {}
      return next;
    });
  };

  // Quick lookup sets and maps
  const favoritesSet = useMemo(() => new Set(favorites.map((v) => v.id)), [favorites]);
  const historyMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const h of watchHistory) {
      map.set(h.video.id, h.progressPercent);
    }
    return map;
  }, [watchHistory]);

  const continueWatchingList = useMemo(
    () => getContinueWatchingList(watchHistory),
    [watchHistory]
  );

  const handlePlayVideo = (video: VideoItem, seekTime = 0) => {
    setActiveVideo(video);
    setPlayerSeekTime(seekTime);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0B0F] text-slate-100">
      {/* Age Verification Gate */}
      <AgeVerificationModal onVerified={() => setIsAgeVerified(true)} />

      {/* Top Header */}
      <Header
        currentTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab as any);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenSearch={() => {
          setSearchQuery('');
          setIsSearchOpen(true);
        }}
        favoritesCount={favorites.length}
      />

      {/* Main Content Body */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6">
        {activeTab === 'library' ? (
          <LibraryView
            favorites={favorites}
            watchHistory={watchHistory}
            onSelectVideo={handlePlayVideo}
            onRemoveFavorite={handleToggleFavorite}
            onClearHistory={handleClearHistory}
            isHistoryEnabled={isHistoryEnabled}
            onToggleHistoryEnabled={handleToggleHistoryEnabled}
          />
        ) : activeTab === 'trending' ? (
          <div>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
                  <Flame className="w-6 h-6 text-[#E50914]" />
                  <span>Trending Adult Videos</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Highest engagement, verified creators, and viewer favorites updated in real-time.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {bestVideos.map((vid) => (
                <VideoCard
                  key={vid.id}
                  video={vid}
                  onSelect={handlePlayVideo}
                  isFavorite={favoritesSet.has(vid.id)}
                  onToggleFavorite={handleToggleFavorite}
                  progressPercent={historyMap.get(vid.id)}
                />
              ))}
            </div>
          </div>
        ) : activeTab === 'categories' ? (
          <div>
            <div className="mb-6 pb-4 border-b border-white/10">
              <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
                <Layers className="w-6 h-6 text-[#E50914]" />
                <span>Explore Popular Categories</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Browse verified channels and categorized adult video collections.
              </p>
            </div>

            <CategoryPills
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => handleSelectCategory(cat)}
            />

            {selectedCategory && (
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-4 capitalize">
                  {selectedCategory.replace(/-/g, ' ')} Collection
                </h2>
                {categoryVideos.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {categoryVideos.map((vid) => (
                      <VideoCard
                        key={vid.id}
                        video={vid}
                        onSelect={handlePlayVideo}
                        isFavorite={favoritesSet.has(vid.id)}
                        onToggleFavorite={handleToggleFavorite}
                        progressPercent={historyMap.get(vid.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-12 flex justify-center text-slate-400">
                    <Loader2 className="w-8 h-8 text-[#E50914] animate-spin" />
                  </div>
                )}
              </div>
            )}

            {!selectedCategory && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {trendingVideos.map((vid) => (
                  <VideoCard
                    key={vid.id}
                    video={vid}
                    onSelect={handlePlayVideo}
                    isFavorite={favoritesSet.has(vid.id)}
                    onToggleFavorite={handleToggleFavorite}
                    progressPercent={historyMap.get(vid.id)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* HOME TAB */
          <div>
            {/* Hero Featured Video Spotlight */}
            {featuredVideo && (
              <HeroBanner
                video={featuredVideo}
                onPlay={handlePlayVideo}
                isFavorite={favoritesSet.has(featuredVideo.id)}
                onToggleFavorite={handleToggleFavorite}
              />
            )}

            {/* Continue Watching Row (if user has active history) */}
            {continueWatchingList.length > 0 && (
              <HorizontalSlider
                title="Continue Watching"
                videos={continueWatchingList.map((h) => h.video)}
                onSelectVideo={(v) => {
                  const entry = continueWatchingList.find((h) => h.video.id === v.id);
                  handlePlayVideo(v, entry?.currentTime || 0);
                }}
                favorites={favoritesSet}
                onToggleFavorite={handleToggleFavorite}
                historyMap={historyMap}
              />
            )}

            {/* Popular Categories Interactive Segmented Bar */}
            <CategoryPills
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => {
                handleSelectCategory(cat);
                if (cat) {
                  setSearchQuery(cat);
                  setIsSearchOpen(true);
                }
              }}
            />

            {/* Loading Indicator */}
            {loadingFeeds && (
              <div className="py-8 flex items-center justify-center gap-3 text-sm text-slate-400">
                <Loader2 className="w-5 h-5 text-[#E50914] animate-spin" />
                <span>Loading latest streaming catalog...</span>
              </div>
            )}

            {/* Trending Now Slider */}
            <HorizontalSlider
              title="Trending Now"
              videos={trendingVideos}
              onSelectVideo={handlePlayVideo}
              favorites={favoritesSet}
              onToggleFavorite={handleToggleFavorite}
              historyMap={historyMap}
              onViewAll={() => setActiveTab('trending')}
            />

            {/* Recently Added Slider */}
            <HorizontalSlider
              title="Recently Added"
              videos={newestVideos}
              onSelectVideo={handlePlayVideo}
              favorites={favoritesSet}
              onToggleFavorite={handleToggleFavorite}
              historyMap={historyMap}
            />

            {/* Top Rated Slider */}
            <HorizontalSlider
              title="Top Rated & Editors' Choice"
              videos={bestVideos}
              onSelectVideo={handlePlayVideo}
              favorites={favoritesSet}
              onToggleFavorite={handleToggleFavorite}
              historyMap={historyMap}
            />

            {/* Curated Grid Section */}
            <section className="mt-8 mb-12">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    Recommended For You
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Curated selection based on popular studio and creator releases.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {trendingVideos.slice(0, 12).map((vid) => (
                  <VideoCard
                    key={vid.id}
                    video={vid}
                    onSelect={handlePlayVideo}
                    isFavorite={favoritesSet.has(vid.id)}
                    onToggleFavorite={handleToggleFavorite}
                    progressPercent={historyMap.get(vid.id)}
                  />
                ))}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Video Player Modal */}
      {activeVideo && (
        <VideoPlayerModal
          video={activeVideo}
          onClose={() => setActiveVideo(null)}
          onSelectRelated={(v) => handlePlayVideo(v, 0)}
          isFavorite={favoritesSet.has(activeVideo.id)}
          onToggleFavorite={handleToggleFavorite}
          onUpdateWatchProgress={handleUpdateWatchProgress}
          initialSeekTime={playerSeekTime}
        />
      )}

      {/* Search and Filters Drawer */}
      <SearchFilterDrawer
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectVideo={handlePlayVideo}
        favorites={favoritesSet}
        onToggleFavorite={handleToggleFavorite}
        initialQuery={searchQuery}
      />

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        currentTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab as any);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenSearch={() => {
          setSearchQuery('');
          setIsSearchOpen(true);
        }}
        favoritesCount={favorites.length}
      />

      {/* Compliance and Legal Disclaimer Footer */}
      <footer className="w-full bg-[#17171D] border-t border-white/5 py-8 px-4 sm:px-8 mt-12 text-xs text-slate-400 select-none">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div>
            <p className="font-semibold text-white mb-1">
              NitePlay &copy; {new Date().getFullYear()} — Premium Adult Video Streaming
            </p>
            <p className="text-[11px] text-slate-400 max-w-xl">
              18+ Notice: Access is restricted strictly to adults of legal age in your jurisdiction. All models depicted were 18 years of age or older at the time of production.
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>2257 Record-Keeping Compliance</span>
            <span>·</span>
            <span>Local Privacy Protected</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
