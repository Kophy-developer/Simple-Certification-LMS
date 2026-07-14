"use client";

import { ExternalLink } from "lucide-react";
import { drivePreviewUrl, driveViewUrl } from "@/lib/drive";

interface VideoPlayerProps {
  partId: string;
  driveFileId: string;
  initialPosition?: number;
  onProgress?: (seconds: number, completed: boolean) => void;
}

export function VideoPlayer({ driveFileId }: VideoPlayerProps) {
  const previewSrc = `${drivePreviewUrl(driveFileId)}?usp=drivesdk`;
  const openUrl = driveViewUrl(driveFileId);

  return (
    <div className="w-full min-w-0 max-w-full space-y-2 overflow-x-hidden">
      <div className="relative aspect-video w-full min-w-0 max-w-full overflow-hidden rounded-xl bg-neutral-950">
        <iframe
          title="Lesson recording"
          src={previewSrc}
          className="absolute inset-0 h-full w-full border-0"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          loading="lazy"
        />
      </div>
      <div className="flex justify-end">
        <a
          href={openUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open in Drive
        </a>
      </div>
    </div>
  );
}
