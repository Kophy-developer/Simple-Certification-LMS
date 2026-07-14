"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import { drivePreviewUrl, driveViewUrl } from "@/lib/drive";

const DESIGN_WIDTH = 640;
const DESIGN_HEIGHT = 360;
const MOBILE_EXTRA_PX = 36;
const MOBILE_BREAKPOINT = 640;
const EMBED_CACHE_BUST = "v2";

interface VideoPlayerProps {
  partId: string;
  driveFileId: string;
  initialPosition?: number;
  onProgress?: (seconds: number, completed: boolean) => void;
}

export function VideoPlayer({ driveFileId }: VideoPlayerProps) {
  const driveOpenUrl = driveViewUrl(driveFileId);
  const previewSrc = `${drivePreviewUrl(driveFileId)}?usp=embed_googleplus&cb=${EMBED_CACHE_BUST}`;
  const outerRef = useRef<HTMLDivElement>(null);
  const [parentWidth, setParentWidth] = useState(0);

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;

    const measure = () => {
      const width = el.clientWidth;
      if (width > 0) setParentWidth(width);
    };

    measure();

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (typeof width === "number" && width > 0) setParentWidth(width);
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const isMobile = parentWidth > 0 && parentWidth < MOBILE_BREAKPOINT;
  const scale = isMobile ? parentWidth / DESIGN_WIDTH : 1;
  const iframeWidth = isMobile ? DESIGN_WIDTH : parentWidth || "100%";
  const iframeHeight = isMobile
    ? DESIGN_HEIGHT + MOBILE_EXTRA_PX / scale
    : parentWidth
      ? (parentWidth * 9) / 16
      : "100%";
  const outerHeight = isMobile
    ? DESIGN_HEIGHT * scale + MOBILE_EXTRA_PX
    : parentWidth
      ? (parentWidth * 9) / 16
      : undefined;

  return (
    <div className="w-full min-w-0 max-w-full space-y-2 overflow-x-hidden">
      <div
        ref={outerRef}
        className="relative w-full max-w-full overflow-hidden rounded-xl bg-muted/30"
        style={
          outerHeight != null
            ? { height: outerHeight }
            : { aspectRatio: "16 / 9" }
        }
      >
        <iframe
          title="Google Drive recording"
          src={previewSrc}
          className="absolute left-0 top-0 border-0"
          style={{
            width: iframeWidth,
            height: iframeHeight,
            transform: isMobile ? `scale(${scale})` : undefined,
            transformOrigin: "top left",
          }}
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
