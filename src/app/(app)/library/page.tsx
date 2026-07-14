import { createClient } from "@/lib/supabase/server";
import { MATERIAL_TOPICS_SELECT } from "@/lib/materials";
import { LibraryClient } from "./library-client";
import type {
  LessonWithTopic,
  MaterialWithTopic,
  Topic,
} from "@/types/database";

export default async function LibraryPage() {
  const supabase = await createClient();

  const [{ data: topics }, { data: lessons }, { data: materials }] =
    await Promise.all([
      supabase.from("topics").select("*").order("sort_order"),
      supabase
        .from("lessons")
        .select("*, topics(id, name), lesson_parts(id)")
        .order("session_date", { ascending: false }),
      supabase
        .from("materials")
        .select(MATERIAL_TOPICS_SELECT)
        .order("year", { ascending: false })
        .order("title"),
    ]);

  return (
    <LibraryClient
      topics={(topics ?? []) as Topic[]}
      lessons={(lessons ?? []) as LessonWithTopic[]}
      materials={(materials ?? []) as MaterialWithTopic[]}
    />
  );
}
