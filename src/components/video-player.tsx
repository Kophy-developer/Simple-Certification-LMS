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
    <div className="space-y-2">
      <div className="relative aspect-video rounded-xl bg-muted/30">
        <iframe
          title="Google Drive recording"
          src={drivePreviewUrl(driveFileId)}
          className="absolute inset-0 h-full w-full rounded-xl border-0"
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
