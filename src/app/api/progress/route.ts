import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lessonId, partId, watchedSeconds, completed } = await request.json();

  if (!lessonId || typeof watchedSeconds !== "number") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  let query = supabase
    .from("progress")
    .select("id")
    .eq("user_id", user.id)
    .eq("lesson_id", lessonId);

  if (partId) {
    query = query.eq("lesson_part_id", partId);
  } else {
    query = query.is("lesson_part_id", null);
  }

  const { data: existing } = await query.maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("progress")
      .update({
        watched_seconds: watchedSeconds,
        completed: completed ?? false,
        last_watched_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  } else {
    const { error } = await supabase.from("progress").insert({
      user_id: user.id,
      lesson_id: lessonId,
      lesson_part_id: partId ?? null,
      watched_seconds: watchedSeconds,
      completed: completed ?? false,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  return NextResponse.json({ success: true });
}
