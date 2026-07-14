import { CheckCircle2, Clock, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, formatWatchTime } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LessonCard } from "@/components/lesson-card";
import { EmptyState } from "@/components/empty-state";
import type { LessonWithTopic } from "@/types/database";

export default async function ProgressPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const [{ data: allProgress }, { data: allLessons }] = await Promise.all([
    supabase
      .from("progress")
      .select("*")
      .eq("user_id", profile!.id),
    supabase.from("lessons").select("id"),
  ]);

  const progressList = allProgress ?? [];
  const totalLessons = allLessons?.length ?? 0;
  const completedCount = progressList.filter((p) => p.completed).length;
  const totalWatchSeconds = progressList.reduce(
    (sum, p) => sum + p.watched_seconds,
    0
  );
  const completionPercent =
    totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;

  const { data: completedLessons } = await supabase
    .from("progress")
    .select("*, lessons(*, topics(id, name))")
    .eq("user_id", profile!.id)
    .eq("completed", true)
    .order("last_watched_at", { ascending: false });

  const completed = (completedLessons ?? []).filter((p) => p.lessons);

  if (totalLessons === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No progress yet"
        description="Start watching lessons to track your study progress here."
        action={{ label: "Browse library", href: "/library" }}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Progress</h1>
        <p className="mt-1 text-muted-foreground">
          Track your CFA study journey.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold">
                {completedCount}/{totalLessons}
              </p>
              <p className="text-sm text-muted-foreground">Lessons completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
              <Clock className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-semibold">
                {formatWatchTime(totalWatchSeconds)}
              </p>
              <p className="text-sm text-muted-foreground">Total watch time</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Overall completion</p>
            <p className="mt-1 text-2xl font-semibold">
              {Math.round(completionPercent)}%
            </p>
            <Progress value={completionPercent} className="mt-3" />
          </CardContent>
        </Card>
      </div>

      {completed.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-medium">Completed lessons</h2>
          <div className="grid gap-3">
            {completed.map((p) => (
              <LessonCard
                key={p.id}
                lesson={p.lessons as LessonWithTopic}
                completed
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
