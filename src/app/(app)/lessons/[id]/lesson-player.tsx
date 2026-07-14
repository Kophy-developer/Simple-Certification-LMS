"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VideoPlayer } from "@/components/video-player";
import { cn } from "@/lib/utils";
import type { LessonPart, LessonWithTopic, Progress } from "@/types/database";
import { CheckCircle2 } from "lucide-react";

interface LessonPlayerProps {
  lesson: LessonWithTopic;
  parts: LessonPart[];
  progressByPart: Record<string, Progress>;
}

export function LessonPlayerClient({
  lesson,
  parts,
  progressByPart,
}: LessonPlayerProps) {
  const sortedParts = useMemo(
    () => [...parts].sort((a, b) => a.sort_order - b.sort_order),
    [parts]
  );

  const firstIncomplete =
    sortedParts.find((part) => !progressByPart[part.id]?.completed) ??
    sortedParts[0];

  const [activePartId, setActivePartId] = useState(
    firstIncomplete?.id ?? sortedParts[0]?.id ?? ""
  );

  const activePart =
    sortedParts.find((part) => part.id === activePartId) ?? sortedParts[0];

  const topicName = lesson.topics?.name ?? "Uncategorized";

  if (!activePart) {
    return (
      <div className="rounded-xl border bg-muted/20 px-6 py-12 text-center text-sm text-muted-foreground">
        This lesson has no video parts yet.
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <VideoPlayer
        key={activePart.id}
        partId={activePart.id}
        driveFileId={activePart.drive_file_id}
      />

      {sortedParts.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {sortedParts.map((part) => {
            const done = progressByPart[part.id]?.completed;
            return (
              <Button
                key={part.id}
                type="button"
                variant={part.id === activePart.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActivePartId(part.id)}
                className={cn("gap-1.5")}
              >
                {done && <CheckCircle2 className="h-3.5 w-3.5" />}
                {part.title}
              </Button>
            );
          })}
        </div>
      )}

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{topicName}</Badge>
          {sortedParts.length > 1 && (
            <Badge variant="outline">{sortedParts.length} parts</Badge>
          )}
          <span className="text-sm text-muted-foreground">
            {format(new Date(lesson.session_date), "MMMM d, yyyy")}
          </span>
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          {lesson.title}
        </h1>
        {sortedParts.length > 1 && (
          <p className="mt-1 text-sm text-muted-foreground">
            Now playing: {activePart.title}
          </p>
        )}
        {lesson.description && (
          <p className="mt-3 text-muted-foreground">{lesson.description}</p>
        )}
      </div>
    </div>
  );
}
