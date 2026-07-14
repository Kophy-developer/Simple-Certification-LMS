import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { LessonPlayerClient } from "./lesson-player";
import type { LessonPart, LessonWithTopic, Progress } from "@/types/database";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: lesson } = await supabase
    .from("lessons")
    .select("*, topics(id, name)")
    .eq("id", id)
    .single();

  if (!lesson) notFound();

  const { data: parts } = await supabase
    .from("lesson_parts")
    .select("*")
    .eq("lesson_id", id)
    .order("sort_order");

  const { data: progressRows } = await supabase
    .from("progress")
    .select("*")
    .eq("user_id", profile!.id)
    .eq("lesson_id", id);

  const progressByPart: Record<string, Progress> = {};
  for (const row of progressRows ?? []) {
    if (row.lesson_part_id) {
      progressByPart[row.lesson_part_id] = row as Progress;
    }
  }

  return (
    <LessonPlayerClient
      lesson={lesson as LessonWithTopic}
      parts={(parts ?? []) as LessonPart[]}
      progressByPart={progressByPart}
    />
  );
}
