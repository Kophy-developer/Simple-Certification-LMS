"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { drivePreviewUrl, driveViewUrl } from "@/lib/drive";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  partId: string;
  driveFileId: string;
  initialPosition?: number;
  onProgress?: (seconds: number, completed: boolean) => void;
}

type Mode = "checking" | "native" | "drive";

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

function DriveEmbed({ driveFileId }: { driveFileId: string }) {
  return (
    <div className="w-full min-w-0 max-w-full space-y-2">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
        <iframe
          title="Lesson recording"
          src={`${drivePreviewUrl(driveFileId)}?usp=drivesdk`}
          className="absolute inset-0 h-full w-full border-0"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      <div className="flex justify-end">
        <a
          href={driveViewUrl(driveFileId)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          Open in Drive
        </a>
      </div>
    </div>
  );
}

function NativePlayer({
  partId,
  driveFileId,
  initialPosition = 0,
  onProgress,
  onStreamFailed,
}: VideoPlayerProps & { onStreamFailed: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimerRef = useRef<number | null>(null);
  const lastSyncRef = useRef(0);
  const hasSeekedRef = useRef(false);
  const failedRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [scrubbing, setScrubbing] = useState(false);
  const [scrubTime, setScrubTime] = useState(0);

  const streamUrl = `/api/stream/part/${partId}`;
  const posterUrl = drivePosterUrl(driveFileId);
  const displayTime = scrubbing ? scrubTime : currentTime;
  const progressPercent =
    duration > 0 ? Math.min(100, Math.max(0, (displayTime / duration) * 100)) : 0;

  const failOver = useCallback(() => {
    if (failedRef.current) return;
    failedRef.current = true;
    onStreamFailed();
  }, [onStreamFailed]);

  const syncProgress = useCallback(
    (force = false) => {
      const video = videoRef.current;
      if (!video || !onProgress) return;
      const now = Date.now();
      if (!force && now - lastSyncRef.current < 12000) return;
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
    hideTimerRef.current = window.setTimeout(() => setControlsVisible(false), 2500);
  }, [clearHideTimer]);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    scheduleHideControls();
  }, [scheduleHideControls]);

  const togglePlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    showControls();
    if (!video.paused) {
      video.pause();
      return;
    }
    try {
      await video.play();
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      if (name === "AbortError" || name === "NotAllowedError") return;
      failOver();
    }
  }, [failOver, showControls]);

  const skipBy = useCallback(
    (delta: number) => {
      const video = videoRef.current;
      if (!video || !Number.isFinite(video.duration)) return;
      showControls();
      video.currentTime = Math.min(
        Math.max(0, video.currentTime + delta),
        video.duration
      );
      setCurrentTime(video.currentTime);
      syncProgress(true);
    },
    [showControls, syncProgress]
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const timeout = window.setTimeout(() => {
      if (video.readyState < 2) failOver();
    }, 8000);

    const onMeta = () => {
      setDuration(video.duration || 0);
      if (initialPosition > 0 && !hasSeekedRef.current) {
        video.currentTime = initialPosition;
        hasSeekedRef.current = true;
      }
    };
    const onReady = () => setLoading(false);
    const onPlay = () => {
      setPlaying(true);
      setLoading(false);
      scheduleHideControls();
    };
    const onPause = () => {
      setPlaying(false);
      setControlsVisible(true);
      clearHideTimer();
      syncProgress(true);
    };
    const onTime = () => {
      if (!scrubbing) setCurrentTime(video.currentTime);
      syncProgress();
    };
    const onEnded = () => {
      setPlaying(false);
      setControlsVisible(true);
      syncProgress(true);
    };
    const onError = () => failOver();

    video.addEventListener("loadedmetadata", onMeta);
    video.addEventListener("canplay", onReady);
    video.addEventListener("playing", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("ended", onEnded);
    video.addEventListener("error", onError);

    return () => {
      window.clearTimeout(timeout);
      video.removeEventListener("loadedmetadata", onMeta);
      video.removeEventListener("canplay", onReady);
      video.removeEventListener("playing", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("error", onError);
      clearHideTimer();
      syncProgress(true);
    };
  }, [
    clearHideTimer,
    failOver,
    initialPosition,
    partId,
    scheduleHideControls,
    scrubbing,
    syncProgress,
  ]);

  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  return (
    <div
      ref={containerRef}
      className="group relative aspect-video w-full min-w-0 max-w-full overflow-hidden rounded-xl bg-black select-none"
      onPointerMove={showControls}
    >
      <video
        ref={videoRef}
        src={streamUrl}
        poster={posterUrl}
        playsInline
        preload="auto"
        className="absolute inset-0 h-full w-full object-contain"
        onClick={() => void togglePlay()}
      />

      {loading && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/20">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      )}

      <div
        className={cn(
          "absolute inset-0 z-10 flex flex-col justify-end transition-opacity duration-200",
          controlsVisible || !playing
            ? "opacity-100"
            : "pointer-events-none opacity-0"
        )}
      >
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-5">
          <button
            type="button"
            aria-label="Back 10 seconds"
            className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white"
            onClick={() => skipBy(-10)}
          >
            <RotateCcw className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label={playing ? "Pause" : "Play"}
            className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-zinc-900 shadow"
            onClick={() => void togglePlay()}
          >
            {playing ? (
              <Pause className="h-6 w-6" fill="currentColor" />
            ) : (
              <Play className="ml-0.5 h-6 w-6" fill="currentColor" />
            )}
          </button>
          <button
            type="button"
            aria-label="Forward 10 seconds"
            className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white"
            onClick={() => skipBy(10)}
          >
            <RotateCw className="h-5 w-5" />
          </button>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />

        <div className="relative z-10 space-y-2 px-3 pb-3 pt-6">
          <div
            className="h-1.5 cursor-pointer rounded-full bg-white/25"
            onPointerDown={(event) => {
              const video = videoRef.current;
              if (!video || !video.duration) return;
              const rect = event.currentTarget.getBoundingClientRect();
              const ratio = (event.clientX - rect.left) / rect.width;
              const next = Math.min(1, Math.max(0, ratio)) * video.duration;
              setScrubbing(true);
              setScrubTime(next);
              video.currentTime = next;
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              if (!scrubbing) return;
              const video = videoRef.current;
              if (!video || !video.duration) return;
              const rect = event.currentTarget.getBoundingClientRect();
              const ratio = (event.clientX - rect.left) / rect.width;
              const next = Math.min(1, Math.max(0, ratio)) * video.duration;
              setScrubTime(next);
              video.currentTime = next;
            }}
            onPointerUp={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId);
              }
              setScrubbing(false);
              syncProgress(true);
            }}
          >
            <div
              className="h-full rounded-full bg-white"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center gap-2 text-white">
            <button type="button" onClick={() => void togglePlay()} className="p-1.5">
              {playing ? (
                <Pause className="h-4 w-4" fill="currentColor" />
              ) : (
                <Play className="h-4 w-4" fill="currentColor" />
              )}
            </button>
            <button
              type="button"
              className="p-1.5"
              onClick={() => {
                const video = videoRef.current;
                if (!video) return;
                video.muted = !video.muted;
                setMuted(video.muted);
              }}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <span className="text-xs tabular-nums text-white/90">
              {formatTime(displayTime)} / {formatTime(duration)}
            </span>
            <div className="flex-1" />
            <button
              type="button"
              className="p-1.5"
              onClick={async () => {
                const root = containerRef.current;
                if (!root) return;
                try {
                  if (document.fullscreenElement) await document.exitFullscreen();
                  else await root.requestFullscreen();
                } catch {
                }
              }}
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
    </div>
  );
}

export function VideoPlayer(props: VideoPlayerProps) {
  const [mode, setMode] = useState<Mode>("checking");

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      try {
        const response = await fetch(`/api/stream/part/${props.partId}`, {
          method: "GET",
          headers: { Range: "bytes=0-1" },
          signal: controller.signal,
        });
        const type = response.headers.get("content-type") ?? "";
        if (
          !cancelled &&
          (response.ok || response.status === 206) &&
          !type.includes("application/json") &&
          !type.includes("text/html")
        ) {
          setMode("native");
          return;
        }
      } catch {
      }
      if (!cancelled) setMode("drive");
    })();

    const timeout = window.setTimeout(() => {
      if (!cancelled) setMode((m) => (m === "checking" ? "drive" : m));
    }, 2500);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [props.partId]);

  if (mode === "checking") {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
        <img
          src={drivePosterUrl(props.driveFileId)}
          alt=""
          className="absolute inset-0 h-full w-full object-contain opacity-80"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/25">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      </div>
    );
  }

  if (mode === "drive") {
    return <DriveEmbed driveFileId={props.driveFileId} />;
  }

  return (
    <NativePlayer {...props} onStreamFailed={() => setMode("drive")} />
  );
}
