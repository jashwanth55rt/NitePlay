'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  Volume1,
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
  PictureInPicture,
  Check,
  Subtitles,
  AudioWaveform,
  Copy,
  RefreshCw,
} from 'lucide-react';
import { VideoItem, VideoDetails } from '@/lib/scraper';
import {
  formatDuration,
  parseDurationString,
  calculateProgress,
  calculateBufferedPercent,
  getOrientationLockLabel,
  isValidResumePosition,
  SUPPORTED_PLAYBACK_SPEEDS,
  clampTime,
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

interface HlsQualityOption {
  index: number;
  label: string;
  height: number;
  bitrate?: number;
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
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [volume, setVolume] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('niteplay_volume');
      if (saved) {
        const v = parseFloat(saved);
        if (!isNaN(v) && v >= 0 && v <= 1) return v;
      }
    }
    return 1;
  });
  const [isMuted, setIsMuted] = useState(false);

  // Playback settings
  const [playbackRate, setPlaybackRate] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('niteplay_speed');
      if (saved) {
        const r = parseFloat(saved);
        if (SUPPORTED_PLAYBACK_SPEEDS.includes(r as any)) return r;
      }
    }
    return 1;
  });
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [showAudioMenu, setShowAudioMenu] = useState(false);

  // HLS stream metadata
  const [qualityLevels, setQualityLevels] = useState<HlsQualityOption[]>([]);
  const [currentQualityIndex, setCurrentQualityIndex] = useState<number>(-1); // -1 = Auto
  const [subtitlesList, setSubtitlesList] = useState<{ id: number; name: string }[]>([]);
  const [currentSubtitleIndex, setCurrentSubtitleIndex] = useState<number>(-1); // -1 = Off
  const [audioTracksList, setAudioTracksList] = useState<{ id: number; name: string }[]>([]);
  const [currentAudioIndex, setCurrentAudioIndex] = useState<number>(0);

  // Buffering, errors, recovery
  const [isBuffering, setIsBuffering] = useState(true);
  const [isAutoplayBlocked, setIsAutoplayBlocked] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isPipActive, setIsPipActive] = useState(false);
  const [pipSupported] = useState(() => {
    if (typeof document !== 'undefined' && 'pictureInPictureEnabled' in document) {
      return document.pictureInPictureEnabled;
    }
    return false;
  });

  // Layout & Fullscreen
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [resumedBanner, setResumedBanner] = useState<string | null>(null);
  const [isLandscapeLocked, setIsLandscapeLocked] = useState(false);
  const [isForcedCssLandscape, setIsForcedCssLandscape] = useState(false);
  const [orientationToast, setOrientationToast] = useState<string | null>(null);
  const [shareToast, setShareToast] = useState<string | null>(null);

  // Double tap feedback state
  const [doubleTapFeedback, setDoubleTapFeedback] = useState<'left' | 'right' | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const lastProgressSavedRef = useRef<number>(0);
  const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });
  const activeVideoIdRef = useRef<string>(video.id);

  // Update active video ID ref on prop change
  useEffect(() => {
    activeVideoIdRef.current = video.id;
  }, [video.id]);

  // 1. Fetch detailed metadata with race-condition cancelation
  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      setLoadingDetails(true);
      setErrorMsg(null);
      setRetryCount(0);
      setIsAutoplayBlocked(false);
      try {
        const queryUrl = video.url ? `?url=${encodeURIComponent(video.url)}` : '';
        const res = await fetch(`/api/videos/${video.id}${queryUrl}`);
        const json = await res.json();
        if (!isCancelled) {
          if (json.success && json.video) {
            setDetails(json.video);
          } else {
            setDetails(video as VideoDetails);
          }
        }
      } catch {
        if (!isCancelled) {
          setDetails(video as VideoDetails);
        }
      } finally {
        if (!isCancelled) setLoadingDetails(false);
      }
    }

    loadData();
    return () => {
      isCancelled = true;
    };
  }, [video.id, video.url, video]);


  // Helper to safely detach & clean up HLS and media element
  const cleanupMedia = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    const videoEl = videoRef.current;
    if (videoEl) {
      videoEl.pause();
      videoEl.removeAttribute('src');
      videoEl.load();
    }
  }, []);

  // 2. Initialize HLS.js or native HTML5 video with retry limits and MP4 fallback
  const initializePlayback = useCallback(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    cleanupMedia();

    const streamUrl = details?.m3u8Url || video.m3u8Url;
    const fallbackMp4 = details?.mp4Urls?.[0] || details?.previewVideo || video.previewVideo;

    setIsBuffering(true);
    setErrorMsg(null);
    setIsAutoplayBlocked(false);

    // Apply saved speed and volume
    videoEl.playbackRate = playbackRate;
    videoEl.volume = volume;
    videoEl.muted = isMuted;

    let initialSeekApplied = false;
    const applyInitialSeek = () => {
      if (initialSeekApplied) return;
      initialSeekApplied = true;
      if (isValidResumePosition(initialSeekTime, videoEl.duration || video.durationSeconds || 600)) {
        videoEl.currentTime = initialSeekTime;
        setResumedBanner(`Resumed from ${formatDuration(initialSeekTime)}`);
        setTimeout(() => setResumedBanner(null), 3500);
      }
    };

    if (streamUrl && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      });
      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(videoEl);

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        setIsBuffering(false);
        applyInitialSeek();

        // Extract quality levels
        if (data && data.levels && data.levels.length > 0) {
          const lvls: HlsQualityOption[] = data.levels.map((lvl, idx) => ({
            index: idx,
            label: lvl.height ? `${lvl.height}p` : `${Math.round((lvl.bitrate || 0) / 1000)}kbps`,
            height: lvl.height || 0,
            bitrate: lvl.bitrate,
          }));
          setQualityLevels(lvls);
        }

        // Extract subtitles
        if (hls.subtitleTracks && hls.subtitleTracks.length > 0) {
          setSubtitlesList(
            hls.subtitleTracks.map((t, idx) => ({
              id: idx,
              name: t.name || t.lang || `Track ${idx + 1}`,
            }))
          );
        }

        // Extract audio tracks
        if (hls.audioTracks && hls.audioTracks.length > 1) {
          setAudioTracksList(
            hls.audioTracks.map((t, idx) => ({
              id: idx,
              name: t.name || t.lang || `Audio ${idx + 1}`,
            }))
          );
        }

        videoEl.play().catch(() => {
          setIsPlaying(false);
          setIsAutoplayBlocked(true);
        });
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        setCurrentQualityIndex(hls.autoLevelEnabled ? -1 : data.level);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (!data.fatal) return;

        console.warn('HLS fatal error encountered:', data.type, data.details);
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          if (retryCount < 2) {
            setRetryCount((prev) => prev + 1);
            hls.startLoad();
            return;
          }
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          if (retryCount < 2) {
            setRetryCount((prev) => prev + 1);
            hls.recoverMediaError();
            return;
          }
        }

        // If recovery unsuccessful, attempt MP4 fallback
        hls.destroy();
        hlsRef.current = null;

        if (fallbackMp4) {
          videoEl.src = fallbackMp4;
          videoEl.load();
          applyInitialSeek();
          videoEl.play().catch(() => {
            setIsPlaying(false);
            setIsAutoplayBlocked(true);
          });
        } else {
          setErrorMsg('Stream temporarily restricted or unavailable from upstream.');
          setIsBuffering(false);
        }
      });
    } else if (streamUrl && videoEl.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Apple HLS (Safari iOS/macOS)
      videoEl.src = streamUrl;
      videoEl.addEventListener('loadedmetadata', applyInitialSeek, { once: true });
      videoEl.play().catch(() => {
        setIsPlaying(false);
        setIsAutoplayBlocked(true);
      });
    } else if (fallbackMp4) {
      // Fallback direct MP4
      videoEl.src = fallbackMp4;
      videoEl.addEventListener('loadedmetadata', applyInitialSeek, { once: true });
      videoEl.play().catch(() => {
        setIsPlaying(false);
        setIsAutoplayBlocked(true);
      });
    } else {
      setErrorMsg('No authorized streaming source available for this video.');
      setIsBuffering(false);
    }
  }, [
    details?.m3u8Url,
    details?.mp4Urls,
    video.m3u8Url,
    details?.previewVideo,
    video.previewVideo,
    video.durationSeconds,
    initialSeekTime,
    playbackRate,
    volume,
    isMuted,
    retryCount,
    cleanupMedia,
  ]);

  useEffect(() => {
    initializePlayback();
    return () => {
      cleanupMedia();
    };
  }, [initializePlayback, cleanupMedia]);

  // 3. Sync player state and throttled watch progress updates
  const handleTimeUpdate = () => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    const curr = videoEl.currentTime;
    const dur = videoEl.duration || 0;
    setCurrentTime(curr);
    setDuration(dur);
    setIsBuffering(false);
    setIsAutoplayBlocked(false);

    // Calculate buffered range
    if (videoEl.buffered.length > 0 && dur > 0) {
      let maxBuffered = 0;
      for (let i = 0; i < videoEl.buffered.length; i++) {
        if (videoEl.buffered.start(i) <= curr && videoEl.buffered.end(i) >= curr) {
          maxBuffered = videoEl.buffered.end(i);
          break;
        } else if (videoEl.buffered.end(i) > maxBuffered) {
          maxBuffered = videoEl.buffered.end(i);
        }
      }
      setBufferedPercent(calculateBufferedPercent(maxBuffered, dur));
    }

    // Throttle progress persistence: at most once every 4 seconds
    const now = Date.now();
    if (dur > 0 && now - lastProgressSavedRef.current >= 4000) {
      lastProgressSavedRef.current = now;
      onUpdateWatchProgress(video, curr, dur);
    }
  };

  const handleManualPlay = () => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    setIsAutoplayBlocked(false);
    videoEl.play().catch((err) => {
      console.warn('Playback gesture error:', err);
    });
  };

  const handlePlayPause = useCallback(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    if (isPlaying) {
      videoEl.pause();
      // Save progress on pause
      if (videoEl.duration > 0) {
        onUpdateWatchProgress(video, videoEl.currentTime, videoEl.duration);
      }
    } else {
      setIsAutoplayBlocked(false);
      videoEl.play().catch(() => {
        setIsAutoplayBlocked(true);
      });
    }
  }, [isPlaying, video, onUpdateWatchProgress]);

  const handleSeek = useCallback((seconds: number) => {
    const videoEl = videoRef.current;
    if (!videoEl || duration <= 0) return;
    const target = clampTime(videoEl.currentTime + seconds, duration);
    videoEl.currentTime = target;
    setCurrentTime(target);
    onUpdateWatchProgress(video, target, duration);
  }, [duration, video, onUpdateWatchProgress]);

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const videoEl = videoRef.current;
    if (!videoEl || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const target = clampTime(pos * duration, duration);
    videoEl.currentTime = target;
    setCurrentTime(target);
    onUpdateWatchProgress(video, target, duration);
  };

  // Double-tap seeking on mobile screens
  const handleVideoTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const now = Date.now();
    const touch = e.changedTouches[0];
    if (!touch || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    const isLeftSide = touchX < rect.width / 2;

    if (now - lastTapRef.current.time < 300) {
      // Double tap triggered
      if (isLeftSide) {
        handleSeek(-10);
        setDoubleTapFeedback('left');
      } else {
        handleSeek(10);
        setDoubleTapFeedback('right');
      }
      setTimeout(() => setDoubleTapFeedback(null), 600);
      lastTapRef.current = { time: 0, x: 0 };
    } else {
      lastTapRef.current = { time: now, x: touchX };
      // Toggle controls on single tap
      setShowControls((prev) => !prev);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
    setIsMuted(val === 0);
    try {
      localStorage.setItem('niteplay_volume', String(val));
    } catch {}
  };

  const toggleMute = useCallback(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    const nextMuted = !isMuted;
    videoEl.muted = nextMuted;
    setIsMuted(nextMuted);
    if (!nextMuted && volume === 0) {
      setVolume(0.5);
      videoEl.volume = 0.5;
    }
  }, [isMuted, volume]);

  const handleSpeedSelect = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    try {
      localStorage.setItem('niteplay_speed', String(rate));
    } catch {}
    setShowSpeedMenu(false);
    setShowSettingsMenu(false);
  };

  const handleQualitySelect = (levelIndex: number) => {
    if (!hlsRef.current) return;
    if (levelIndex === -1) {
      hlsRef.current.currentLevel = -1; // Auto
      setCurrentQualityIndex(-1);
    } else {
      hlsRef.current.currentLevel = levelIndex;
      setCurrentQualityIndex(levelIndex);
    }
    setShowQualityMenu(false);
    setShowSettingsMenu(false);
  };

  const handleSubtitleSelect = (trackIndex: number) => {
    if (hlsRef.current) {
      hlsRef.current.subtitleTrack = trackIndex;
      setCurrentSubtitleIndex(trackIndex);
    } else if (videoRef.current && videoRef.current.textTracks) {
      for (let i = 0; i < videoRef.current.textTracks.length; i++) {
        videoRef.current.textTracks[i].mode = i === trackIndex ? 'showing' : 'hidden';
      }
      setCurrentSubtitleIndex(trackIndex);
    }
    setShowSubtitleMenu(false);
    setShowSettingsMenu(false);
  };

  const handleAudioTrackSelect = (trackIndex: number) => {
    if (hlsRef.current) {
      hlsRef.current.audioTrack = trackIndex;
      setCurrentAudioIndex(trackIndex);
    }
    setShowAudioMenu(false);
    setShowSettingsMenu(false);
  };

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  const togglePictureInPicture = useCallback(async () => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPipActive(false);
      } else {
        await videoEl.requestPictureInPicture();
        setIsPipActive(true);
      }
    } catch (err) {
      console.warn('Picture-in-Picture error:', err);
    }
  }, []);

  const handleShareVideo = async () => {
    const shareData = {
      title: video.title,
      text: `Watch ${video.title} on NitePlay`,
      url: window.location.href,
    };
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        setShareToast('Shared successfully');
        setTimeout(() => setShareToast(null), 3000);
        return;
      } catch (err) {
        // User cancelled or share failed, fallback to clipboard
      }
    }

    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareToast('Link copied to clipboard!');
      setTimeout(() => setShareToast(null), 3000);
    } catch {
      setShareToast('Unable to copy link');
      setTimeout(() => setShareToast(null), 3000);
    }
  };

  const toggleLandscapeLock = async () => {
    const nextLocked = !isLandscapeLocked;
    setIsLandscapeLocked(nextLocked);

    if (nextLocked) {
      if (containerRef.current && !document.fullscreenElement) {
        try {
          await containerRef.current.requestFullscreen();
          setIsFullscreen(true);
        } catch (err) {
          console.warn('Fullscreen request failed:', err);
        }
      }

      let nativeLocked = false;
      if (typeof screen !== 'undefined' && screen.orientation && 'lock' in screen.orientation) {
        try {
          await (screen.orientation as any).lock('landscape');
          nativeLocked = true;
        } catch (err) {
          console.warn('Native orientation lock not permitted:', err);
        }
      }

      if (typeof window !== 'undefined') {
        const isPortrait = window.innerHeight > window.innerWidth;
        if (isPortrait && !nativeLocked) {
          setIsForcedCssLandscape(true);
        }
      }

      setOrientationToast('Orientation Locked: Landscape');
      setTimeout(() => setOrientationToast(null), 3500);
    } else {
      if (typeof screen !== 'undefined' && screen.orientation && 'unlock' in screen.orientation) {
        try {
          screen.orientation.unlock();
        } catch {}
      }
      setIsForcedCssLandscape(false);
      setOrientationToast('Orientation Unlocked');
      setTimeout(() => setOrientationToast(null), 3000);
    }
  };

  // Fullscreen and visibility change listeners
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
          } catch {}
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && videoRef.current && videoRef.current.duration > 0) {
        onUpdateWatchProgress(video, videoRef.current.currentTime, videoRef.current.duration);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isLandscapeLocked, onUpdateWatchProgress, video]);

  // Keyboard accessibility shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        handlePlayPause();
      } else if (e.key === 'ArrowLeft' || e.key === 'j') {
        e.preventDefault();
        handleSeek(-10);
      } else if (e.key === 'ArrowRight' || e.key === 'l') {
        e.preventDefault();
        handleSeek(10);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const nextVol = Math.min(1, volume + 0.1);
        setVolume(nextVol);
        if (videoRef.current) {
          videoRef.current.volume = nextVol;
          videoRef.current.muted = false;
        }
        setIsMuted(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextVol = Math.max(0, volume - 0.1);
        setVolume(nextVol);
        if (videoRef.current) {
          videoRef.current.volume = nextVol;
          videoRef.current.muted = nextVol === 0;
        }
        setIsMuted(nextVol === 0);
      } else if (e.key === 'm') {
        e.preventDefault();
        toggleMute();
      } else if (e.key === 'f') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'p' && pipSupported) {
        e.preventDefault();
        togglePictureInPicture();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handlePlayPause,
    handleSeek,
    onClose,
    toggleMute,
    toggleFullscreen,
    togglePictureInPicture,
    duration,
    pipSupported,
    volume,
  ]);

  // Idle controls hide handler
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying && !showSettingsMenu && !showSpeedMenu && !showQualityMenu) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const currentVideo = details || video;
  const remainingTime = Math.max(0, duration - currentTime);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Video Player"
      className="fixed inset-0 z-50 bg-[#0B0B0F]/95 backdrop-blur-xl overflow-y-auto"
    >
      <div className="max-w-6xl mx-auto min-h-screen px-4 sm:px-6 py-4 sm:py-6 flex flex-col">
        {/* Top bar with back/close and action buttons */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 truncate">
            <button
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Close Video Player"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-sm sm:text-base font-bold text-white truncate">
              {currentVideo.title}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Share button */}
            <button
              onClick={handleShareVideo}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 flex items-center gap-2 text-xs font-semibold transition-colors focus:outline-none"
              aria-label="Share Video"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>

            {/* Favorite toggle */}
            <button
              onClick={() => onToggleFavorite(video)}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl border flex items-center gap-2 text-xs font-semibold transition-colors focus:outline-none ${
                isFavorite
                  ? 'bg-[#E50914] text-white border-[#E50914]'
                  : 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/10'
              }`}
              aria-label={isFavorite ? 'Saved in library' : 'Save to library'}
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
          onTouchEnd={handleVideoTouchEnd}
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
            onPlay={() => {
              setIsPlaying(true);
              setIsAutoplayBlocked(false);
            }}
            onPause={() => setIsPlaying(false)}
            onWaiting={() => setIsBuffering(true)}
            onPlaying={() => {
              setIsBuffering(false);
              setIsAutoplayBlocked(false);
            }}
            onTimeUpdate={handleTimeUpdate}
            onClick={handlePlayPause}
            className="w-full h-full object-contain cursor-pointer"
          />

          {/* Double Tap Seek Feedback Ripple */}
          {doubleTapFeedback && (
            <div
              className={`absolute top-0 bottom-0 ${
                doubleTapFeedback === 'left' ? 'left-0' : 'right-0'
              } w-1/3 flex items-center justify-center bg-white/10 backdrop-blur-xs pointer-events-none animate-pulse`}
            >
              <div className="flex flex-col items-center text-white">
                {doubleTapFeedback === 'left' ? (
                  <RotateCcw className="w-8 h-8" />
                ) : (
                  <RotateCw className="w-8 h-8" />
                )}
                <span className="text-xs font-bold mt-1">10s</span>
              </div>
            </div>
          )}

          {/* Center Play Button if Autoplay is blocked */}
          {isAutoplayBlocked && !isPlaying && !errorMsg && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-30">
              <button
                onClick={handleManualPlay}
                className="w-20 h-20 rounded-full bg-[#E50914] text-white flex items-center justify-center shadow-2xl shadow-[#E50914]/50 hover:scale-105 active:scale-95 transition-all focus:outline-none"
                aria-label="Start Playback"
              >
                <Play className="w-9 h-9 fill-white translate-x-0.5" />
              </button>
              <span className="text-xs font-semibold text-white/90 mt-3">Click to start video</span>
            </div>
          )}

          {/* Buffering Indicator */}
          {isBuffering && !errorMsg && !isAutoplayBlocked && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none z-20">
              <Loader2 className="w-12 h-12 text-[#E50914] animate-spin" />
            </div>
          )}

          {/* Resumed Pill Banner */}
          {resumedBanner && (
            <div className="absolute top-4 left-4 z-20 px-3.5 py-1.5 rounded-lg bg-black/80 border border-white/20 text-xs font-semibold text-white pointer-events-none">
              {resumedBanner}
            </div>
          )}

          {/* Toast notifications */}
          {(orientationToast || shareToast) && (
            <div className="absolute top-4 left-4 z-30 px-3.5 py-1.5 rounded-lg bg-black/85 border border-[#E50914]/50 text-xs font-semibold text-white flex items-center gap-2 pointer-events-none shadow-lg shadow-black/80">
              <span>{orientationToast || shareToast}</span>
            </div>
          )}

          {/* Screen Orientation Lock Trigger in Top-Right */}
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

          {/* Playback Error Overlay with Retry */}
          {errorMsg && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-black/90 text-center z-30">
              <AlertCircle className="w-12 h-12 text-[#E50914] mb-3" />
              <p className="text-sm font-semibold text-white mb-2">{errorMsg}</p>
              <p className="text-xs text-slate-400 max-w-sm mb-4">
                The streaming server may require a fresh connection or alternative format.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={initializePlayback}
                  className="px-5 py-2.5 rounded-xl bg-[#E50914] text-white text-xs font-bold hover:bg-[#c20711] transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Stream</span>
                </button>
                {video.url && (
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-white/10 text-slate-200 text-xs font-semibold hover:bg-white/20 transition-colors"
                  >
                    Original Site
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Custom Controls Bar Overlay */}
          <div
            className={`absolute inset-x-0 bottom-0 p-3 sm:p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-opacity duration-300 z-20 ${
              showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {/* Seek Bar with Buffered Progress */}
            <div
              onClick={handleProgressBarClick}
              className="relative w-full h-2 bg-white/20 hover:h-3 rounded-full cursor-pointer transition-all mb-3 group/bar"
            >
              {/* Buffered progress track */}
              <div
                className="absolute top-0 left-0 h-full bg-white/30 rounded-full transition-all"
                style={{ width: `${bufferedPercent}%` }}
              />
              {/* Played progress track */}
              <div
                className="absolute top-0 left-0 h-full bg-[#E50914] rounded-full"
                style={{ width: `${calculateProgress(currentTime, duration)}%` }}
              />
              {/* Scrubber thumb */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md opacity-0 group-hover/bar:opacity-100 transition-opacity"
                style={{ left: `calc(${calculateProgress(currentTime, duration)}% - 7px)` }}
              />
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between gap-2 sm:gap-4 text-white">
              {/* Left Controls */}
              <div className="flex items-center gap-1.5 sm:gap-2">
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
                <div className="hidden sm:flex items-center gap-1 group/vol">
                  <button
                    onClick={toggleMute}
                    className="min-h-[40px] min-w-[40px] p-2 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors focus:outline-none"
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-5 h-5" />
                    ) : volume < 0.5 ? (
                      <Volume1 className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
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
                <div className="text-[11px] sm:text-xs font-mono font-medium text-slate-300 ml-1">
                  <span>{formatDuration(currentTime)}</span>
                  <span className="mx-1 text-slate-500">/</span>
                  <span>{formatDuration(duration || currentVideo.durationSeconds || 600)}</span>
                  <span className="hidden md:inline text-slate-500 ml-2">
                    (-{formatDuration(remainingTime)})
                  </span>
                </div>
              </div>

              {/* Right Tools (Speed, Quality, Subtitles, PiP, Fullscreen) */}
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Playback Speed Button & Menu */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowSpeedMenu(!showSpeedMenu);
                      setShowQualityMenu(false);
                      setShowSubtitleMenu(false);
                      setShowAudioMenu(false);
                    }}
                    className="min-h-[38px] px-2 py-1.5 rounded-lg hover:bg-white/10 text-xs font-bold text-slate-200 flex items-center gap-1 transition-colors"
                    aria-label="Playback speed"
                  >
                    <span>{playbackRate}x</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {showSpeedMenu && (
                    <div className="absolute bottom-full right-0 mb-2 py-1 bg-[#17171D] border border-white/15 rounded-xl shadow-xl z-30 min-w-[100px]">
                      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
                        Speed
                      </div>
                      {SUPPORTED_PLAYBACK_SPEEDS.map((rate) => (
                        <button
                          key={rate}
                          onClick={() => handleSpeedSelect(rate)}
                          className={`w-full px-3 py-1.5 text-xs text-left hover:bg-white/10 flex items-center justify-between ${
                            playbackRate === rate ? 'text-[#E50914] font-bold' : 'text-slate-300'
                          }`}
                        >
                          <span>{rate}x</span>
                          {playbackRate === rate && <Check className="w-3 h-3 text-[#E50914]" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Video Quality Menu (when HLS levels available) */}
                {qualityLevels.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowQualityMenu(!showQualityMenu);
                        setShowSpeedMenu(false);
                        setShowSubtitleMenu(false);
                        setShowAudioMenu(false);
                      }}
                      className="min-h-[38px] px-2 py-1.5 rounded-lg hover:bg-white/10 text-xs font-bold text-slate-200 flex items-center gap-1 transition-colors"
                      aria-label="Select Video Quality"
                    >
                      <span>
                        {currentQualityIndex === -1
                          ? 'Auto'
                          : qualityLevels[currentQualityIndex]?.label || 'HD'}
                      </span>
                      <ChevronDown className="w-3 h-3" />
                    </button>

                    {showQualityMenu && (
                      <div className="absolute bottom-full right-0 mb-2 py-1 bg-[#17171D] border border-white/15 rounded-xl shadow-xl z-30 min-w-[110px]">
                        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
                          Quality
                        </div>
                        <button
                          onClick={() => handleQualitySelect(-1)}
                          className={`w-full px-3 py-1.5 text-xs text-left hover:bg-white/10 flex items-center justify-between ${
                            currentQualityIndex === -1 ? 'text-[#E50914] font-bold' : 'text-slate-300'
                          }`}
                        >
                          <span>Auto</span>
                          {currentQualityIndex === -1 && (
                            <Check className="w-3 h-3 text-[#E50914]" />
                          )}
                        </button>
                        {qualityLevels.map((lvl) => (
                          <button
                            key={lvl.index}
                            onClick={() => handleQualitySelect(lvl.index)}
                            className={`w-full px-3 py-1.5 text-xs text-left hover:bg-white/10 flex items-center justify-between ${
                              currentQualityIndex === lvl.index
                                ? 'text-[#E50914] font-bold'
                                : 'text-slate-300'
                            }`}
                          >
                            <span>{lvl.label}</span>
                            {currentQualityIndex === lvl.index && (
                              <Check className="w-3 h-3 text-[#E50914]" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Subtitles Menu (if available) */}
                {subtitlesList.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowSubtitleMenu(!showSubtitleMenu);
                        setShowSpeedMenu(false);
                        setShowQualityMenu(false);
                        setShowAudioMenu(false);
                      }}
                      className="min-h-[38px] p-2 rounded-lg hover:bg-white/10 text-slate-200 transition-colors"
                      aria-label="Subtitles"
                    >
                      <Subtitles className="w-4 h-4" />
                    </button>

                    {showSubtitleMenu && (
                      <div className="absolute bottom-full right-0 mb-2 py-1 bg-[#17171D] border border-white/15 rounded-xl shadow-xl z-30 min-w-[120px]">
                        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
                          Captions
                        </div>
                        <button
                          onClick={() => handleSubtitleSelect(-1)}
                          className={`w-full px-3 py-1.5 text-xs text-left hover:bg-white/10 flex items-center justify-between ${
                            currentSubtitleIndex === -1
                              ? 'text-[#E50914] font-bold'
                              : 'text-slate-300'
                          }`}
                        >
                          <span>Off</span>
                          {currentSubtitleIndex === -1 && (
                            <Check className="w-3 h-3 text-[#E50914]" />
                          )}
                        </button>
                        {subtitlesList.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => handleSubtitleSelect(t.id)}
                            className={`w-full px-3 py-1.5 text-xs text-left hover:bg-white/10 flex items-center justify-between ${
                              currentSubtitleIndex === t.id
                                ? 'text-[#E50914] font-bold'
                                : 'text-slate-300'
                            }`}
                          >
                            <span>{t.name}</span>
                            {currentSubtitleIndex === t.id && (
                              <Check className="w-3 h-3 text-[#E50914]" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Picture in Picture */}
                {pipSupported && (
                  <button
                    onClick={togglePictureInPicture}
                    className="min-h-[38px] p-2 rounded-lg hover:bg-white/10 text-slate-200 transition-colors hidden sm:flex items-center justify-center focus:outline-none"
                    aria-label={isPipActive ? 'Exit Picture-in-Picture' : 'Picture-in-Picture'}
                    title="Picture-in-Picture"
                  >
                    <PictureInPicture className="w-4 h-4" />
                  </button>
                )}

                {/* Screen Orientation Lock Button */}
                <button
                  onClick={toggleLandscapeLock}
                  className={`min-h-[38px] px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all focus:outline-none ${
                    isLandscapeLocked
                      ? 'bg-[#E50914] text-white shadow-md shadow-[#E50914]/40'
                      : 'hover:bg-white/10 text-slate-200'
                  }`}
                  aria-label={getOrientationLockLabel(isLandscapeLocked)}
                  title={getOrientationLockLabel(isLandscapeLocked)}
                >
                  <Smartphone className="w-4 h-4 -rotate-90" />
                  <span className="hidden sm:inline text-[11px]">
                    {isLandscapeLocked ? 'Locked' : 'Rotate'}
                  </span>
                </button>

                {/* Fullscreen Toggle */}
                <button
                  onClick={toggleFullscreen}
                  className="min-h-[38px] min-w-[38px] p-2 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors focus:outline-none"
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

          {/* Categories and Microtags */}
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
