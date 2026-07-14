import { createClient } from "@/lib/supabase/server";
import { LibraryClient } from "./library-client";
import type { LessonWithTopic, Topic } from "@/types/database";

export default async function LibraryPage() {
  const supabase = await createClient();

  const [{ data: topics }, { data: lessons }] = await Promise.all([
    supabase.from("topics").select("*").order("sort_order"),
    supabase
      .from("lessons")
      .select("*, topics(id, name), lesson_parts(id)")
      .order("session_date", { ascending: false }),
  ]);

  return (
    <LibraryClient
      topics={(topics ?? []) as Topic[]}
      lessons={(lessons ?? []) as LessonWithTopic[]}
    />
  );
}
