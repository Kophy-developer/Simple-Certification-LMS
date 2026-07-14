import { createClient } from "@/lib/supabase/server";
import { ManageLessonsClient } from "./manage-lessons-client";
import type { LessonWithTopic, Topic } from "@/types/database";

export default async function ManageLessonsPage() {
  const supabase = await createClient();

  const [{ data: lessons }, { data: topics }] = await Promise.all([
    supabase
      .from("lessons")
      .select("*, topics(id, name)")
      .order("session_date", { ascending: false }),
    supabase.from("topics").select("*").order("sort_order"),
  ]);

  return (
    <ManageLessonsClient
      lessons={(lessons ?? []) as LessonWithTopic[]}
      topics={(topics ?? []) as Topic[]}
    />
  );
}
