"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { drivePreviewUrl } from "@/lib/drive";
import { Button } from "@/components/ui/button";

interface VideoPlayerProps {
  partId: string;
  driveFileId: string;
  initialPosition?: number;
  onProgress?: (seconds: number, completed: boolean) => void;
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
  const lastSyncRef = useRef(0);
  const hasSeekedRef = useRef(false);

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

    const handleLoadedMetadata = () => {
      setLoading(false);
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
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("error", handleError);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("error", handleError);
      syncProgress(true);
    };
  }, [initialPosition, syncProgress, retryCount, usePreview, partId]);

  if (usePreview) {
    return (
      <div className="space-y-2">
        <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
          <iframe
            title="Google Drive recording"
            src={drivePreviewUrl(driveFileId)}
            className="h-full w-full border-0"
            allow="autoplay"
            allowFullScreen
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Playing via Google Drive preview. For best results, share the file as
          Anyone with the link → Viewer.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-xl bg-muted px-4 text-center">
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button type="button" variant="outline" size="sm" onClick={() => setUsePreview(true)}>
          Open Drive preview
        </Button>
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
