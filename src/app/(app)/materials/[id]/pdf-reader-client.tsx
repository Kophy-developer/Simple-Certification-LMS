"use client";

import { useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { LinkButton } from "@/components/link-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PdfReaderClientProps {
  materialId: string;
  title: string;
  year: number;
  topicName: string;
  fileName: string;
}

export function PdfReaderClient({
  materialId,
  title,
  year,
  topicName,
  fileName,
}: PdfReaderClientProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch(
          `/api/materials/${materialId}/download?mode=view`
        );
        const data = await response.json();
        if (!response.ok || !data.url) {
          if (!cancelled) {
            setError(data.error ?? "Could not load PDF");
            setLoading(false);
          }
          return;
        }
        if (!cancelled) {
          setUrl(data.url);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError("Could not load PDF");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [materialId]);

  const download = async () => {
    const response = await fetch(
      `/api/materials/${materialId}/download?mode=download`
    );
    const data = await response.json();
    if (response.ok && data.url) {
      window.open(data.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="flex min-h-[70vh] flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <LinkButton href="/library" variant="ghost" size="sm">
            Back to library
          </LinkButton>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{topicName}</Badge>
            <Badge variant="outline">{year}</Badge>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{fileName}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={download}>
          <Download className="mr-1.5 h-4 w-4" />
          Download
        </Button>
      </div>

      <div className="relative min-h-[70vh] flex-1 overflow-hidden rounded-xl border bg-muted/20">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        {error && (
          <div className="flex h-full min-h-[70vh] items-center justify-center px-6 text-center text-sm text-muted-foreground">
            {error}
          </div>
        )}
        {url && !error && (
          <iframe
            title={title}
            src={`${url}#view=FitH`}
            className="h-[75vh] w-full border-0 bg-white"
          />
        )}
      </div>
    </div>
  );
}
