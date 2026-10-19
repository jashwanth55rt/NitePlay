'use client';

import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Heart,
  Star,
  Clock,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Settings,
  AlertCircle,
  Loader2,
  ChevronDown,
  Smartphone,
  Lock,
} from 'lucide-react';
import { VideoItem, VideoDetails } from '@/lib/scraper';
import {
  formatDuration,
  parseDurationString,
  calculateProgress,
  getOrientationLockLabel,
  shouldApplyCssRotation,
} from '@/lib/player-utils';
import VideoCard from './VideoCard';

interface VideoPlayerModalProps {
  video: VideoItem;
  onClose: () => void;
  onSelectRelated: (video: VideoItem) => void;
  isFavorite: boolean;
  onToggleFavorite: (video: VideoItem) => void;
  onUpdateWatchProgress: (video: VideoItem, currentTime: number, duration: number) => void;
  initialSeekTime?: number;
}

export default function VideoPlayerModal({
  video,
  onClose,
  onSelectRelated,
  isFavorite,
  onToggleFavorite,
  onUpdateWatchProgress,
  initialSeekTime = 0,
}: VideoPlayerModalProps) {
  const [details, setDetails] = useState<VideoDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [resumedBanner, setResumedBanner] = useState<string | null>(null);
  const [isLandscapeLocked, setIsLandscapeLocked] = useState(false);
  const [isForcedCssLandscape, setIsForcedCssLandscape] = useState(false);
  const [orientationToast, setOrientationToast] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  // 1. Fetch detailed metadata and authorized streaming URLs
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoadingDetails(true);
      setErrorMsg(null);
      try {
        const res = await fetch(`/api/videos/${video.id}?url=${encodeURIComponent(video.url)}`);
        const json = await res.json();
        if (isMounted) {
          if (json.success && json.video) {
            setDetails(json.video);
          } else {
            // fallback to video prop
            setDetails(video as VideoDetails);
          }
        }
      } catch (err) {
        if (isMounted) {
          setDetails(video as VideoDetails);
        }
      } finally {
        if (isMounted) setLoadingDetails(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [video.id, video.url]);

  // 2. Initialize HLS.js or native HTML5 video
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const streamUrl = details?.m3u8Url || video.m3u8Url;
    const fallbackMp4 = details?.mp4Urls?.[0] || details?.previewVideo || video.previewVideo;

    setIsBuffering(true);
    setErrorMsg(null);

    if (streamUrl && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });
      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(videoEl);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsBuffering(false);
        // Resume playback if requested
        if (initialSeekTime > 5) {
          videoEl.currentTime = initialSeekTime;
          setResumedBanner(`Resumed from ${formatDuration(initialSeekTime)}`);
          setTimeout(() => setResumedBanner(null), 4000);
        }
        videoEl.play().catch(() => {
          setIsPlaying(false);
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.warn('HLS fatal error encountered, falling back to MP4:', data);
          hls.destroy();
          hlsRef.current = null;

          if (fallbackMp4) {
            videoEl.src = fallbackMp4;
            videoEl.load();
            videoEl.play().catch(() => {});
          } else {
            setErrorMsg('Stream temporarily restricted or format unsupported.');
          }
        }
      });
    } else if (streamUrl && videoEl.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Apple HLS (Safari/iOS)
      videoEl.src = streamUrl;
      if (initialSeekTime > 5) {
        videoEl.currentTime = initialSeekTime;
      }
      videoEl.play().catch(() => {});
    } else if (fallbackMp4) {
      // Fallback direct MP4
      videoEl.src = fallbackMp4;
      if (initialSeekTime > 5) {
        videoEl.currentTime = initialSeekTime;
      }
      videoEl.play().catch(() => {});
    } else {
      setErrorMsg('No direct streaming URL authorized for this video.');
      setIsBuffering(false);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [details?.m3u8Url, details?.mp4Urls, initialSeekTime]);

  // 3. Sync player state and watch progress updates
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 0;
    setCurrentTime(curr);
    setDuration(dur);
    setIsBuffering(false);

    // Save watch progress locally every 3 seconds
    if (dur > 0 && Math.floor(curr) % 3 === 0) {
      onUpdateWatchProgress(video, curr, dur);
    }
  };

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleSeek = (seconds: number) => {
    if (!videoRef.current) return;
    const newTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
    videoRef.current.currentTime = newTime;
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pos * duration;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
    if (!nextMuted && volume === 0) {
      setVolume(0.5);
      videoRef.current.volume = 0.5;
    }
  };

  const handleSpeedSelect = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    setShowSpeedMenu(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const toggleLandscapeLock = async () => {
    const nextLocked = !isLandscapeLocked;
    setIsLandscapeLocked(nextLocked);

    if (nextLocked) {
      // 1. Enter fullscreen on the player container if not already active
      if (containerRef.current && !document.fullscreenElement) {
        try {
          await containerRef.current.requestFullscreen();
          setIsFullscreen(true);
        } catch (err) {
          console.warn('Fullscreen request failed:', err);
        }
      }

      // 2. Attempt native Screen Orientation API lock
      let nativeLocked = false;
      if (typeof screen !== 'undefined' && screen.orientation && 'lock' in screen.orientation) {
        try {
          await (screen.orientation as any).lock('landscape');
          nativeLocked = true;
        } catch (err) {
          console.warn('Native orientation lock not permitted or rejected:', err);
        }
      }

      // 3. Fallback CSS forced rotation for portrait mobile browsers (like iOS Safari)
      if (typeof window !== 'undefined') {
        const isPortrait = window.innerHeight > window.innerWidth;
        if (isPortrait && !nativeLocked) {
          setIsForcedCssLandscape(true);
        }
      }

      setOrientationToast('Orientation Locked: Landscape');
      setTimeout(() => setOrientationToast(null), 3500);
    } else {
      // Unlock orientation
      if (typeof screen !== 'undefined' && screen.orientation && 'unlock' in screen.orientation) {
        try {
          screen.orientation.unlock();
        } catch (err) {}
      }
      setIsForcedCssLandscape(false);
      setOrientationToast('Orientation Unlocked');
      setTimeout(() => setOrientationToast(null), 3000);
    }
  };

  // Sync orientation and clean up upon exiting fullscreen or unmounting
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      if (!isFs && isLandscapeLocked) {
        setIsLandscapeLocked(false);
        setIsForcedCssLandscape(false);
        if (typeof screen !== 'undefined' && screen.orientation && 'unlock' in screen.orientation) {
          try {
            screen.orientation.unlock();
          } catch (e) {}
        }
      }
    };

    const handleResize = () => {
      if (typeof window !== 'undefined' && isLandscapeLocked) {
        const isPortrait = window.innerHeight > window.innerWidth;
        setIsForcedCssLandscape(isPortrait);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);

      // Always restore orientation on unmount
      if (typeof screen !== 'undefined' && screen.orientation && 'unlock' in screen.orientation) {
        try {
          screen.orientation.unlock();
        } catch (e) {}
      }
    };
  }, [isLandscapeLocked]);

  // Keyboard accessibility shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        handlePlayPause();
      } else if (e.key === 'ArrowLeft' || e.key === 'j') {
        e.preventDefault();
        handleSeek(-10);
      } else if (e.key === 'ArrowRight' || e.key === 'l') {
        e.preventDefault();
        handleSeek(10);
      } else if (e.key === 'm') {
        e.preventDefault();
        toggleMute();
      } else if (e.key === 'f') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'o' || e.key === 'r') {
        e.preventDefault();
        toggleLandscapeLock();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, duration, isMuted, volume, isLandscapeLocked]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const currentVideo = details || video;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Video Player"
      className="fixed inset-0 z-50 bg-[#0B0B0F]/95 backdrop-blur-xl overflow-y-auto"
    >
      <div className="max-w-6xl mx-auto min-h-screen px-4 sm:px-6 py-4 sm:py-6 flex flex-col">
        {/* Top bar with back/close */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 truncate">
            <button
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 flex items-center justify-center transition-colors focus:outline-none"
              aria-label="Close Video Player"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-sm sm:text-base font-bold text-white truncate">
              {currentVideo.title}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onToggleFavorite(video)}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl border flex items-center gap-2 text-xs font-semibold transition-colors focus:outline-none ${
                isFavorite
                  ? 'bg-[#E50914] text-white border-[#E50914]'
                  : 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/10'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-white' : ''}`} />
              <span className="hidden sm:inline">{isFavorite ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </div>

        {/* Video Player Frame Container */}
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          style={
            isForcedCssLandscape
              ? {
                  position: 'fixed',
                  top: 0,
                  left: '100vw',
                  width: '100vh',
                  height: '100vw',
                  transform: 'rotate(90deg)',
                  transformOrigin: 'top left',
                  zIndex: 9999,
                  maxWidth: 'none',
                  maxHeight: 'none',
                  borderRadius: 0,
                }
              : undefined
          }
          className={`relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10 flex items-center justify-center group select-none transition-all ${
            isForcedCssLandscape ? 'fixed inset-0 z-[9999] rounded-none border-none' : ''
          }`}
        >
          {/* HTML5 Video Element */}
          <video
            ref={videoRef}
            playsInline
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onWaiting={() => setIsBuffering(true)}
            onPlaying={() => setIsBuffering(false)}
            onTimeUpdate={handleTimeUpdate}
            onClick={handlePlayPause}
            className="w-full h-full object-contain cursor-pointer"
          />

          {/* Buffering Indicator */}
          {isBuffering && !errorMsg && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
              <Loader2 className="w-12 h-12 text-[#E50914] animate-spin" />
            </div>
          )}

          {/* Resumed Pill Banner */}
          {resumedBanner && (
            <div className="absolute top-4 left-4 z-20 px-3.5 py-1.5 rounded-lg bg-black/80 border border-white/20 text-xs font-semibold text-white animate-fade-in pointer-events-none">
              {resumedBanner}
            </div>
          )}

          {/* Orientation Status Toast */}
          {orientationToast && (
            <div className="absolute top-4 left-4 z-30 px-3.5 py-1.5 rounded-lg bg-black/85 border border-[#E50914]/50 text-xs font-semibold text-white animate-fade-in flex items-center gap-2 pointer-events-none shadow-lg shadow-black/80">
              <Smartphone className="w-3.5 h-3.5 text-[#E50914] -rotate-90" />
              <span>{orientationToast}</span>
            </div>
          )}

          {/* Quick Screen Orientation Lock Overlay Trigger in Top-Right */}
          <button
            onClick={toggleLandscapeLock}
            className={`absolute top-4 right-4 z-20 min-h-[38px] px-3 py-1.5 rounded-xl border backdrop-blur-md flex items-center gap-1.5 text-xs font-semibold transition-all duration-300 ${
              showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
            } ${
              isLandscapeLocked
                ? 'bg-[#E50914] text-white border-[#E50914] shadow-lg shadow-[#E50914]/40'
                : 'bg-black/60 hover:bg-black/80 text-white/90 border-white/20'
            }`}
            aria-label={getOrientationLockLabel(isLandscapeLocked)}
            title={getOrientationLockLabel(isLandscapeLocked)}
          >
            <Smartphone className="w-3.5 h-3.5 -rotate-90" />
            <span>{isLandscapeLocked ? 'Locked 90°' : 'Lock Landscape'}</span>
            {isLandscapeLocked && <Lock className="w-3 h-3 text-white ml-0.5" />}
          </button>

          {/* Playback Error Overlay */}
          {errorMsg && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-black/85 text-center z-20">
              <AlertCircle className="w-12 h-12 text-[#E50914] mb-3" />
              <p className="text-sm font-semibold text-white mb-2">{errorMsg}</p>
              <p className="text-xs text-slate-400 max-w-sm mb-4">
                This stream might require direct authentication or format fallback.
              </p>
              {video.url && (
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-[#E50914] text-white text-xs font-bold hover:bg-[#c20711] transition-colors"
                >
                  Open Original Source
                </a>
              )}
            </div>
          )}

          {/* Custom Controls Bar Overlay */}
          <div
            className={`absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-opacity duration-300 z-10 ${
              showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {/* Seek Bar */}
            <div
              onClick={handleProgressBarClick}
              className="relative w-full h-2 bg-white/20 hover:h-3 rounded-full cursor-pointer transition-all mb-4 group/bar"
            >
              <div
                className="absolute top-0 left-0 h-full bg-[#E50914] rounded-full"
                style={{ width: `${calculateProgress(currentTime, duration)}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md opacity-0 group-hover/bar:opacity-100 transition-opacity"
                style={{ left: `calc(${calculateProgress(currentTime, duration)}% - 7px)` }}
              />
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between gap-3 text-white">
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Play/Pause */}
                <button
                  onClick={handlePlayPause}
                  className="min-h-[40px] min-w-[40px] p-2 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors focus:outline-none"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
                </button>

                {/* Seek -10s */}
                <button
                  onClick={() => handleSeek(-10)}
                  className="min-h-[40px] min-w-[40px] p-2 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors focus:outline-none"
                  aria-label="Rewind 10 seconds"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Seek +10s */}
                <button
                  onClick={() => handleSeek(10)}
                  className="min-h-[40px] min-w-[40px] p-2 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors focus:outline-none"
                  aria-label="Forward 10 seconds"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                {/* Volume & Slider */}
                <div className="flex items-center gap-1.5 group/vol">
                  <button
                    onClick={toggleMute}
                    className="min-h-[40px] min-w-[40px] p-2 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors focus:outline-none"
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-16 sm:w-20 accent-[#E50914] cursor-pointer"
                    aria-label="Volume slider"
                  />
                </div>

                {/* Duration Timestamp */}
                <div className="text-xs font-mono font-medium text-slate-300 ml-1">
                  <span>{formatDuration(currentTime)}</span>
                  <span className="mx-1 text-slate-500">/</span>
                  <span>{formatDuration(duration || currentVideo.durationSeconds || 600)}</span>
                </div>
              </div>

              {/* Right Tools (Speed, Fullscreen) */}
              <div className="flex items-center gap-2">
                {/* Speed Selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                    className="min-h-[40px] px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-xs font-bold text-slate-200 flex items-center gap-1 transition-colors"
                    aria-label="Playback speed"
                  >
                    <span>{playbackRate}x</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  {showSpeedMenu && (
                    <div className="absolute bottom-full right-0 mb-2 py-1 bg-[#17171D] border border-white/15 rounded-xl shadow-xl z-30 min-w-[80px]">
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                        <button
                          key={rate}
                          onClick={() => handleSpeedSelect(rate)}
                          className={`w-full px-3 py-1.5 text-xs text-left hover:bg-white/10 ${
                            playbackRate === rate ? 'text-[#E50914] font-bold' : 'text-slate-300'
                          }`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Screen Orientation Lock Button */}
                <button
                  onClick={toggleLandscapeLock}
                  className={`min-h-[40px] px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all focus:outline-none ${
                    isLandscapeLocked
                      ? 'bg-[#E50914] text-white shadow-md shadow-[#E50914]/40'
                      : 'hover:bg-white/10 text-slate-200'
                  }`}
                  aria-label={getOrientationLockLabel(isLandscapeLocked)}
                  title={getOrientationLockLabel(isLandscapeLocked)}
                >
                  <Smartphone className="w-4 h-4 -rotate-90" />
                  {isLandscapeLocked ? (
                    <div className="flex items-center gap-1">
                      <Lock className="w-3 h-3 text-white" />
                      <span className="hidden sm:inline text-[11px]">Landscape</span>
                    </div>
                  ) : (
                    <span className="hidden sm:inline text-[11px] font-semibold">Rotate</span>
                  )}
                </button>

                {/* Fullscreen Toggle */}
                <button
                  onClick={toggleFullscreen}
                  className="min-h-[40px] min-w-[40px] p-2 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors focus:outline-none"
                  aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                >
                  {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Video Metadata & Creator Info */}
        <div className="mt-6 bg-[#17171D] rounded-2xl border border-white/5 p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-white/5">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-white mb-3">
                {currentVideo.title}
              </h1>

              {/* Zero-pill metadata line */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm text-slate-300 font-medium">
                <span className="flex items-center gap-1 text-white font-semibold">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{currentVideo.rating || 98}% Approval</span>
                </span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4 text-slate-400" />
                  <span>{currentVideo.views || '450K views'}</span>
                </span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>{currentVideo.duration || '10:00'}</span>
                </span>
              </div>
            </div>

            {/* Likes & Dislikes Feedback */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-semibold text-slate-200">
                <ThumbsUp className="w-4 h-4 text-emerald-400" />
                <span>{currentVideo.likes?.toLocaleString() || '2.4K'}</span>
              </div>
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-semibold text-slate-400">
                <ThumbsDown className="w-4 h-4 text-red-400" />
                <span>{currentVideo.dislikes?.toLocaleString() || '38'}</span>
              </div>
            </div>
          </div>

          {/* Uploader / Creator info row */}
          <div className="flex items-center justify-between gap-4 py-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#E50914] to-red-900 flex items-center justify-center font-bold text-white text-base">
                {currentVideo.uploader?.slice(0, 1).toUpperCase() || 'C'}
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  {currentVideo.uploader || 'Verified Creator'}
                </h4>
                <p className="text-xs text-slate-400">
                  {currentVideo.uploaderSubscribers ? `${(currentVideo.uploaderSubscribers / 1000).toFixed(1)}K subscribers` : 'Official Channel'}
                </p>
              </div>
            </div>

            <button
              onClick={() => onToggleFavorite(video)}
              className={`min-h-[44px] px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                isFavorite
                  ? 'bg-white/15 text-white border border-white/20'
                  : 'bg-[#E50914] text-white hover:bg-[#c20711] shadow-md shadow-[#E50914]/25'
              }`}
            >
              {isFavorite ? 'In Favorites' : '+ Add to Library'}
            </button>
          </div>

          {/* Categories and Microtags (Zero-pill discipline) */}
          <div className="pt-4 space-y-3">
            {currentVideo.categories && currentVideo.categories.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                <span className="text-slate-500 font-semibold">Categories:</span>
                {currentVideo.categories.map((c, i) => (
                  <React.Fragment key={c}>
                    <span className="hover:text-white cursor-pointer">{c}</span>
                    {i < currentVideo.categories!.length - 1 && (
                      <span aria-hidden="true" className="text-slate-600">·</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}

            {currentVideo.tags && currentVideo.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className="text-slate-500 font-semibold">Tags:</span>
                {currentVideo.tags.map((t, i) => (
                  <React.Fragment key={t}>
                    <span>#{t}</span>
                    {i < currentVideo.tags!.length - 1 && (
                      <span aria-hidden="true" className="text-slate-600">·</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Related Videos Section */}
        {details?.relatedVideos && details.relatedVideos.length > 0 && (
          <div className="mt-8 mb-12">
            <h3 className="text-lg font-bold text-white mb-4">
              Related Recommendations
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {details.relatedVideos.slice(0, 8).map((rel) => (
                <VideoCard
                  key={rel.id}
                  video={rel}
                  onSelect={(v) => {
                    onSelectRelated(v);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  isFavorite={isFavorite}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
