"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, Loader2, Play } from "lucide-react";
import { drivePreviewUrl, driveViewUrl } from "@/lib/drive";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/link-button";

interface VideoPlayerProps {
  partId: string;
  driveFileId: string;
  initialPosition?: number;
  onProgress?: (seconds: number, completed: boolean) => void;
}

function usePreferNativeDriveWatch() {
  const [preferWatch, setPreferWatch] = useState(false);

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const iOS =
      /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setPreferWatch(coarse || iOS);
  }, []);

  return preferWatch;
}

export function VideoPlayer({
  partId,
  driveFileId,
  initialPosition = 0,
  onProgress,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [usePreview, setUsePreview] = useState(false);
  const preferDriveWatch = usePreferNativeDriveWatch();
  const lastSyncRef = useRef(0);
  const hasSeekedRef = useRef(false);
  const driveOpenUrl = driveViewUrl(driveFileId);

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

  useEffect(() => {
    hasSeekedRef.current = false;
    setError(null);
    setLoading(true);
    setUsePreview(false);
    setRetryCount(0);
  }, [partId]);

  useEffect(() => {
    if (usePreview) return;
    const video = videoRef.current;
    if (!video) return;

    const clearLoading = () => setLoading(false);

    const handleLoadedMetadata = () => {
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
        setError(null);
        setLoading(true);
      } else {
        setUsePreview(true);
        setLoading(false);
        setError(null);
      }
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("canplay", clearLoading);
    video.addEventListener("playing", clearLoading);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("error", handleError);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("canplay", clearLoading);
      video.removeEventListener("playing", clearLoading);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("error", handleError);
      syncProgress(true);
    };
  }, [initialPosition, syncProgress, retryCount, usePreview, partId]);

  useEffect(() => {
    if (usePreview || !loading) return;
    const timeout = window.setTimeout(() => {
      setUsePreview(true);
      setLoading(false);
      setError(null);
    }, 20000);
    return () => window.clearTimeout(timeout);
  }, [usePreview, loading, partId, retryCount]);

  if (usePreview) {
    if (preferDriveWatch) {
      return (
        <div className="space-y-2">
          <div className="flex aspect-video flex-col items-center justify-center gap-4 rounded-xl border bg-muted/30 px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background">
              <Play className="h-6 w-6 fill-current" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Watch this recording</p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Opens in Google Drive so you can pause and seek reliably on
                mobile.
              </p>
            </div>
            <LinkButton href={driveOpenUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              Watch on Google Drive
            </LinkButton>
          </div>
          <p className="text-xs text-muted-foreground">
            Direct streaming was unavailable. Drive opens in a new tab for the
            best mobile playback.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="relative aspect-video rounded-xl bg-muted">
          <iframe
            title="Google Drive recording"
            src={drivePreviewUrl(driveFileId)}
            className="absolute inset-0 h-full w-full rounded-xl border-0"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Playing via Google Drive preview. For best results, share the file as
            Anyone with the link → Viewer.
          </p>
          <LinkButton
            href={driveOpenUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="outline"
            size="sm"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open in Drive
          </LinkButton>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-xl bg-muted px-4 text-center">
        <p className="text-sm text-muted-foreground">{error}</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setError(null);
              setLoading(false);
              setUsePreview(true);
            }}
          >
            Use Drive preview
          </Button>
          <LinkButton href={driveOpenUrl} target="_blank" rel="noopener noreferrer" size="sm">
            <ExternalLink className="h-4 w-4" />
            Watch on Google Drive
          </LinkButton>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      )}
      <video
        ref={videoRef}
        key={streamUrl}
        src={streamUrl}
        controls
        playsInline
        preload="metadata"
        className="h-full w-full"
      />
    </div>
  );
}
