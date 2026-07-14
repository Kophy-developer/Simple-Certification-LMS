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
  const driveOpenUrl = driveViewUrl(driveFileId);

  return (
    <div className="w-full min-w-0 max-w-full space-y-2">
      <div className="relative aspect-video w-full max-w-full overflow-hidden rounded-xl bg-muted/30">
        <iframe
          title="Google Drive recording"
          src={drivePreviewUrl(driveFileId)}
          className="absolute inset-0 h-0 w-0 max-h-full max-w-full min-h-full min-w-full border-0"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      <div className="flex justify-end">
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
