"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { drivePreviewUrl, driveViewUrl } from "@/lib/drive";
import { Button } from "@/components/ui/button";

const STREAM_LOAD_TIMEOUT_MS = 20000;

interface VideoPlayerProps {
  partId: string;
  driveFileId: string;
  initialPosition?: number;
  onProgress?: (seconds: number, completed: boolean) => void;
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [usePreview, setUsePreview] = useState(false);
  const lastSyncRef = useRef(0);
  const hasSeekedRef = useRef(false);
  const driveOpenUrl = driveViewUrl(driveFileId);
  const posterUrl = drivePosterUrl(driveFileId);

  const streamUrl = `/api/stream/part/${partId}${retryCount > 0 ? `?retry=${retryCount}` : ""}`;

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

  const fallBackToPreview = useCallback(() => {
    setUsePreview(true);
    setLoading(false);
  }, []);

  useEffect(() => {
    hasSeekedRef.current = false;
    setLoading(true);
    setUsePreview(false);
    setRetryCount(0);
  }, [partId]);

  useEffect(() => {
    if (usePreview) return;
    const video = videoRef.current;
    if (!video) return;

    video.setAttribute("webkit-playsinline", "true");
    video.setAttribute("playsinline", "true");

    const clearLoading = () => setLoading(false);

    const handleReady = () => {
      clearLoading();
      if (initialPosition > 0 && !hasSeekedRef.current) {
        video.currentTime = initialPosition;
        hasSeekedRef.current = true;
      }
    };

    const handleTimeUpdate = () => syncProgress();
    const handlePause = () => syncProgress(true);
    const handleEnded = () => syncProgress(true);

    const handleError = () => {
      if (retryCount < 1) {
        setRetryCount((c) => c + 1);
        setLoading(true);
      } else {
        fallBackToPreview();
      }
    };

    const timeoutId = window.setTimeout(() => {
      if (video.readyState < 2) {
        fallBackToPreview();
      }
    }, STREAM_LOAD_TIMEOUT_MS);

    video.addEventListener("loadeddata", handleReady);
    video.addEventListener("canplay", clearLoading);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("error", handleError);

    return () => {
      window.clearTimeout(timeoutId);
      video.removeEventListener("loadeddata", handleReady);
      video.removeEventListener("canplay", clearLoading);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("error", handleError);
      syncProgress(true);
    };
  }, [
    initialPosition,
    syncProgress,
    retryCount,
    usePreview,
    partId,
    fallBackToPreview,
  ]);

  if (usePreview) {
    return (
      <div className="w-full min-w-0 max-w-full space-y-2">
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
          <iframe
            title="Google Drive recording"
            src={drivePreviewUrl(driveFileId)}
            className="h-full w-full border-0"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Stream unavailable — playing via Drive preview. Pause may show a
            black frame (Drive UI).
          </p>
          <a
            href={driveOpenUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Open in Drive
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-2">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
        {loading && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/40">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}
        <video
          ref={videoRef}
          key={streamUrl}
          src={streamUrl}
          poster={posterUrl}
          controls
          playsInline
          preload="metadata"
          className="h-full w-full"
        />
      </div>
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-auto px-0 text-xs text-muted-foreground"
          onClick={fallBackToPreview}
        >
          Use Drive preview
        </Button>
        <a
          href={driveOpenUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          Open in Drive
        </a>
      </div>
    </div>
  );
}
