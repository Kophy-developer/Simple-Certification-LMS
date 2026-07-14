import Link from "next/link";
import { format } from "date-fns";
import { Play, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatDuration } from "@/lib/auth";
import type { LessonWithTopic } from "@/types/database";
import { cn } from "@/lib/utils";

interface LessonCardProps {
  lesson: LessonWithTopic;
  progressPercent?: number;
  completed?: boolean;
  className?: string;
}

export function LessonCard({
  lesson,
  progressPercent = 0,
  completed = false,
  className,
}: LessonCardProps) {
  const topicName = lesson.topics?.name ?? "Uncategorized";

  return (
    <Link href={`/lessons/${lesson.id}`}>
      <Card
        className={cn(
          "group transition-colors hover:border-primary/40 hover:bg-muted/30",
          className
        )}
      >
        <CardContent className="flex gap-4 p-4">
          <div className="relative flex h-16 w-24 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            {completed ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            ) : (
              <Play className="h-6 w-6 text-primary" />
            )}
            {progressPercent > 0 && !completed && (
              <div className="absolute bottom-1 left-1 right-1">
                <Progress value={progressPercent} className="h-1" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="truncate font-medium group-hover:text-primary">
                {lesson.title}
              </h3>
              {lesson.duration_seconds && (
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDuration(lesson.duration_seconds)}
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {topicName}
              </Badge>
              {(lesson.lesson_parts?.length ?? 0) > 1 && (
                <Badge variant="outline" className="text-xs">
                  {lesson.lesson_parts!.length} parts
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {format(new Date(lesson.session_date), "MMM d, yyyy")}
              </span>
            </div>
            {lesson.description && (
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                {lesson.description}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
