"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  ExternalLink,
  Loader2,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { driveViewUrl } from "@/lib/drive";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  partId: string;
  driveFileId: string;
  initialPosition?: number;
  onProgress?: (seconds: number, completed: boolean) => void;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function drivePosterUrl(fileId: string): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1280`;
}

export function VideoPlayer({
  partId,
  driveFileId,
  initialPosition = 0,
  onProgress,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimerRef = useRef<number | null>(null);
  const lastSyncRef = useRef(0);
  const hasSeekedRef = useRef(false);
  const dragProgressRef = useRef<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [scrubbing, setScrubbing] = useState(false);
  const [scrubTime, setScrubTime] = useState(0);

  const streamUrl = `/api/stream/part/${partId}${retryCount > 0 ? `?retry=${retryCount}` : ""}`;
  const posterUrl = drivePosterUrl(driveFileId);
  const driveOpenUrl = driveViewUrl(driveFileId);
  const displayTime = scrubbing ? scrubTime : currentTime;
  const progressPercent =
    duration > 0 ? Math.min(100, Math.max(0, (displayTime / duration) * 100)) : 0;

  const syncProgress = useCallback(
    (force = false) => {
      const video = videoRef.current;
      if (!video || !onProgress) return;
      const now = Date.now();
      if (!force && now - lastSyncRef.current < 10000) return;
      lastSyncRef.current = now;
      const completed =
        video.duration > 0 && video.currentTime / video.duration >= 0.95;
      onProgress(Math.floor(video.currentTime), completed);
    },
    [onProgress]
  );

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current != null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const scheduleHideControls = useCallback(() => {
    clearHideTimer();
    const video = videoRef.current;
    if (!video || video.paused) return;
    hideTimerRef.current = window.setTimeout(() => {
      setControlsVisible(false);
    }, 2800);
  }, [clearHideTimer]);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    scheduleHideControls();
  }, [scheduleHideControls]);

  const togglePlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    showControls();
    try {
      if (video.paused) {
        await video.play();
      } else {
        video.pause();
      }
    } catch {
      setError("Playback was blocked. Tap play again.");
    }
  }, [showControls]);

  const skipBy = useCallback(
    (delta: number) => {
      const video = videoRef.current;
      if (!video || !Number.isFinite(video.duration)) return;
      showControls();
      video.currentTime = Math.min(
        video.duration,
        Math.max(0, video.currentTime + delta)
      );
      setCurrentTime(video.currentTime);
      syncProgress(true);
    },
    [showControls, syncProgress]
  );

  const seekToRatio = useCallback(
    (ratio: number) => {
      const video = videoRef.current;
      if (!video || !Number.isFinite(video.duration) || video.duration <= 0) {
        return;
      }
      const next = Math.min(1, Math.max(0, ratio)) * video.duration;
      video.currentTime = next;
      setCurrentTime(next);
      setScrubTime(next);
    },
    []
  );

  const onProgressPointer = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      if (rect.width <= 0) return;
      const ratio = (event.clientX - rect.left) / rect.width;
      dragProgressRef.current = ratio;
      const video = videoRef.current;
      if (video && video.duration > 0) {
        setScrubTime(ratio * video.duration);
      }
      seekToRatio(ratio);
    },
    [seekToRatio]
  );

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    showControls();
  }, [showControls]);

  const toggleFullscreen = useCallback(async () => {
    const root = containerRef.current;
    if (!root) return;
    showControls();
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await root.requestFullscreen();
      }
    } catch {
    }
  }, [showControls]);

  const retry = useCallback(() => {
    setError(null);
    setLoading(true);
    setRetryCount((c) => c + 1);
    hasSeekedRef.current = false;
  }, []);

  useEffect(() => {
    hasSeekedRef.current = false;
    setLoading(true);
    setError(null);
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setControlsVisible(true);
    setRetryCount(0);
  }, [partId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.setAttribute("playsinline", "true");
    video.setAttribute("webkit-playsinline", "true");

    const onLoadedMetadata = () => {
      setDuration(video.duration || 0);
      if (initialPosition > 0 && !hasSeekedRef.current) {
        video.currentTime = initialPosition;
        hasSeekedRef.current = true;
        setCurrentTime(initialPosition);
      }
    };

    const onCanPlay = () => setLoading(false);
    const onWaiting = () => setLoading(true);
    const onPlaying = () => {
      setLoading(false);
      setPlaying(true);
      setError(null);
      scheduleHideControls();
    };
    const onPause = () => {
      setPlaying(false);
      setControlsVisible(true);
      clearHideTimer();
      syncProgress(true);
    };
    const onTimeUpdate = () => {
      if (!scrubbing) setCurrentTime(video.currentTime);
      syncProgress();
    };
    const onEnded = () => {
      setPlaying(false);
      setControlsVisible(true);
      syncProgress(true);
    };
    const onError = () => {
      setLoading(false);
      setPlaying(false);
      if (retryCount < 1) {
        setRetryCount((c) => c + 1);
        setLoading(true);
      } else {
        setError(
          "Could not stream this recording. Check that the Drive file is shared as Anyone with the link → Viewer."
        );
      }
    };

    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", onEnded);
    video.addEventListener("error", onError);

    return () => {
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("error", onError);
      syncProgress(true);
      clearHideTimer();
    };
  }, [
    clearHideTimer,
    initialPosition,
    partId,
    retryCount,
    scheduleHideControls,
    scrubbing,
    streamUrl,
    syncProgress,
  ]);

  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (event.key === " " || event.key === "k") {
        event.preventDefault();
        void togglePlay();
      } else if (event.key === "ArrowLeft" || event.key === "j") {
        event.preventDefault();
        skipBy(-10);
      } else if (event.key === "ArrowRight" || event.key === "l") {
        event.preventDefault();
        skipBy(10);
      } else if (event.key === "m") {
        event.preventDefault();
        toggleMute();
      } else if (event.key === "f") {
        event.preventDefault();
        void toggleFullscreen();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [skipBy, toggleFullscreen, toggleMute, togglePlay]);

  return (
    <div className="w-full min-w-0 max-w-full space-y-2 overflow-x-hidden">
      <div
        ref={containerRef}
        className="group relative aspect-video w-full min-w-0 max-w-full overflow-hidden rounded-xl bg-black select-none"
        onPointerMove={showControls}
        onFocus={showControls}
      >
        <video
          ref={videoRef}
          key={streamUrl}
          src={streamUrl}
          poster={posterUrl}
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full bg-black object-contain"
          onClick={togglePlay}
        />

        {loading && !error && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/25">
            <Loader2 className="h-9 w-9 animate-spin text-white" />
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-zinc-950/90 px-6 text-center">
            <p className="max-w-sm text-sm text-zinc-200">{error}</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={retry}
                className="rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-900"
              >
                Try again
              </button>
              <a
                href={driveOpenUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-2 text-sm text-white"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open in Drive
              </a>
            </div>
          </div>
        )}

        {!error && (
          <div
            className={cn(
              "absolute inset-0 z-10 flex flex-col justify-end transition-opacity duration-200",
              controlsVisible || !playing
                ? "opacity-100"
                : "pointer-events-none opacity-0"
            )}
          >
            <button
              type="button"
              aria-label={playing ? "Pause" : "Play"}
              className="absolute inset-0 z-0"
              onClick={togglePlay}
            />

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-6">
              <button
                type="button"
                aria-label="Back 10 seconds"
                onClick={(e) => {
                  e.stopPropagation();
                  skipBy(-10);
                }}
                className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/60"
              >
                <RotateCcw className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label={playing ? "Pause" : "Play"}
                onClick={(e) => {
                  e.stopPropagation();
                  void togglePlay();
                }}
                className="pointer-events-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-zinc-900 shadow-lg transition hover:scale-105"
              >
                {playing ? (
                  <Pause className="h-7 w-7" fill="currentColor" />
                ) : (
                  <Play className="ml-0.5 h-7 w-7" fill="currentColor" />
                )}
              </button>
              <button
                type="button"
                aria-label="Forward 10 seconds"
                onClick={(e) => {
                  e.stopPropagation();
                  skipBy(10);
                }}
                className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/60"
              >
                <RotateCw className="h-5 w-5" />
              </button>
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />

            <div className="relative z-10 space-y-2 px-3 pb-3 pt-8 sm:px-4">
              <div
                className="group/progress relative h-1.5 cursor-pointer rounded-full bg-white/25"
                onPointerDown={(event) => {
                  event.currentTarget.setPointerCapture(event.pointerId);
                  setScrubbing(true);
                  showControls();
                  onProgressPointer(event);
                }}
                onPointerMove={(event) => {
                  if (!scrubbing) return;
                  onProgressPointer(event);
                }}
                onPointerUp={(event) => {
                  if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                    event.currentTarget.releasePointerCapture(event.pointerId);
                  }
                  setScrubbing(false);
                  syncProgress(true);
                  scheduleHideControls();
                }}
                onPointerCancel={() => {
                  setScrubbing(false);
                  scheduleHideControls();
                }}
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-white"
                  style={{ width: `${progressPercent}%` }}
                />
                <div
                  className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0 shadow transition group-hover/progress:opacity-100 group-active/progress:opacity-100"
                  style={{ left: `${progressPercent}%` }}
                />
              </div>

              <div className="flex items-center gap-2 text-white">
                <button
                  type="button"
                  aria-label={playing ? "Pause" : "Play"}
                  onClick={togglePlay}
                  className="rounded-full p-1.5 transition hover:bg-white/10"
                >
                  {playing ? (
                    <Pause className="h-4 w-4" fill="currentColor" />
                  ) : (
                    <Play className="h-4 w-4" fill="currentColor" />
                  )}
                </button>
                <button
                  type="button"
                  aria-label="Back 10 seconds"
                  onClick={() => skipBy(-10)}
                  className="hidden rounded-full p-1.5 transition hover:bg-white/10 sm:inline-flex"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Forward 10 seconds"
                  onClick={() => skipBy(10)}
                  className="hidden rounded-full p-1.5 transition hover:bg-white/10 sm:inline-flex"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label={muted ? "Unmute" : "Mute"}
                  onClick={toggleMute}
                  className="rounded-full p-1.5 transition hover:bg-white/10"
                >
                  {muted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </button>
                <span className="ml-1 text-xs tabular-nums text-white/90">
                  {formatTime(displayTime)} / {formatTime(duration)}
                </span>
                <div className="flex-1" />
                <button
                  type="button"
                  aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
                  onClick={() => void toggleFullscreen()}
                  className="rounded-full p-1.5 transition hover:bg-white/10"
                >
                  {fullscreen ? (
                    <Minimize className="h-4 w-4" />
                  ) : (
                    <Maximize className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
