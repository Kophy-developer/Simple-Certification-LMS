import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/link-button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function EngagementPage() {
  const supabase = await createClient();

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title")
    .order("created_at", { ascending: false });

  const { data: students } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "student");

  const { data: allProgress } = await supabase.from("progress").select("*");

  const studentCount = students?.length ?? 0;

  const lessonStats = (lessons ?? []).map((lesson) => {
    const lessonProgress = (allProgress ?? []).filter(
      (p) => p.lesson_id === lesson.id
    );
    const started = lessonProgress.filter((p) => p.watched_seconds > 0).length;
    const completed = lessonProgress.filter((p) => p.completed).length;

    return {
      ...lesson,
      started,
      completed,
      startedPercent: studentCount > 0 ? (started / studentCount) * 100 : 0,
      completedPercent: studentCount > 0 ? (completed / studentCount) * 100 : 0,
    };
  });

  return (
    <div className="space-y-6">
      <LinkButton href="/admin" variant="ghost" size="sm">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to admin
      </LinkButton>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Engagement</h1>
        <p className="mt-1 text-muted-foreground">
          See how many students have started or finished each lesson.
        </p>
      </div>

      {lessonStats.length === 0 ? (
        <p className="text-muted-foreground">No lessons yet.</p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lesson</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead className="w-48">Completion rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lessonStats.map((lesson) => (
                <TableRow key={lesson.id}>
                  <TableCell className="font-medium">{lesson.title}</TableCell>
                  <TableCell>
                    {lesson.started}/{studentCount}
                  </TableCell>
                  <TableCell>
                    {lesson.completed}/{studentCount}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={lesson.completedPercent}
                        className="flex-1"
                      />
                      <span className="w-10 text-xs text-muted-foreground">
                        {Math.round(lesson.completedPercent)}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
