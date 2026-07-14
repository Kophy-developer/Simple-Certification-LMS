import Link from "next/link";
import { BookOpen, Clock, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { LessonCard } from "@/components/lesson-card";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/link-button";
import type { LessonWithTopic } from "@/types/database";

export default async function HomePage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: lessons } = await supabase
    .from("lessons")
    .select("*, topics(id, name), lesson_parts(id)")
    .order("created_at", { ascending: false });

  const { data: progressData } = await supabase
    .from("progress")
    .select("*, lessons(*, topics(id, name))")
    .eq("user_id", profile!.id)
    .eq("completed", false)
    .gt("watched_seconds", 0)
    .order("last_watched_at", { ascending: false });

  const allLessons = (lessons ?? []) as LessonWithTopic[];
  const inProgress = (progressData ?? []).filter((p) => p.lessons);
  const recentlyAdded = allLessons.slice(0, 6);
  const isAdmin = profile?.role === "admin";
  const hasLessons = allLessons.length > 0;

  if (!hasLessons) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Your CFA study recordings will appear here.
          </p>
        </div>
        <EmptyState
          icon={BookOpen}
          title="Nothing here yet"
          description={
            isAdmin
              ? "Add your first session recording to get started."
              : "Your next session recording will show up right after class."
          }
          action={
            isAdmin
              ? { label: "Add your first recording", href: "/admin/recordings/new" }
              : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Pick up where you left off or explore new recordings.
        </p>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-medium">
            <Clock className="h-5 w-5 text-primary" />
            Continue Watching
          </h2>
        </div>
        {inProgress.length > 0 ? (
          <div className="grid gap-3">
            {inProgress.map((p) => {
              const lesson = p.lessons as LessonWithTopic;
              const percent = lesson.duration_seconds
                ? (p.watched_seconds / lesson.duration_seconds) * 100
                : 0;
              return (
                <LessonCard
                  key={p.id}
                  lesson={lesson}
                  progressPercent={percent}
                />
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border bg-muted/20 px-6 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Nothing in progress yet. Browse the library to start watching.
            </p>
            <LinkButton href="/library" variant="outline" className="mt-4">
              Browse library
            </LinkButton>
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-medium">
            <Sparkles className="h-5 w-5 text-accent" />
            Recently Added
          </h2>
          <LinkButton href="/library" variant="ghost" size="sm">
            View all
          </LinkButton>
        </div>
        <div className="grid gap-3">
          {recentlyAdded.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))}
        </div>
      </section>
    </div>
  );
}
