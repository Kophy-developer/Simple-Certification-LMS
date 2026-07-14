import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractGoogleDriveFileId, isGoogleDriveUrl } from "@/lib/drive";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { title, topicId, sessionDate, description, parts } = body as {
    title?: string;
    topicId?: string;
    sessionDate?: string;
    description?: string | null;
    parts?: { title?: string; driveUrl: string }[];
  };

  if (!title || !topicId || !sessionDate) {
    return NextResponse.json(
      { error: "Title, topic, and session date are required" },
      { status: 400 }
    );
  }

  if (!parts || parts.length === 0) {
    return NextResponse.json(
      { error: "Add at least one Google Drive link" },
      { status: 400 }
    );
  }

  const normalizedParts = parts.map((part, index) => {
    const driveUrl = part.driveUrl?.trim() ?? "";
    if (!isGoogleDriveUrl(driveUrl)) {
      throw new Error(`Part ${index + 1} is not a valid Google Drive link`);
    }
    const fileId = extractGoogleDriveFileId(driveUrl);
    if (!fileId) {
      throw new Error(`Part ${index + 1}: could not read Drive file ID from link`);
    }
    return {
      title: part.title?.trim() || `Part ${index + 1}`,
      drive_file_id: fileId,
      drive_url: driveUrl,
      sort_order: index + 1,
    };
  });

  try {
    const firstFileId = normalizedParts[0].drive_file_id;

    const { data: lesson, error } = await supabase
      .from("lessons")
      .insert({
        title,
        topic_id: topicId,
        session_date: sessionDate,
        source_type: "google_drive",
        source_ref: firstFileId,
        description: description ?? null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { error: partsError } = await supabase.from("lesson_parts").insert(
      normalizedParts.map((part) => ({
        ...part,
        lesson_id: lesson.id,
      }))
    );

    if (partsError) {
      await supabase.from("lessons").delete().eq("id", lesson.id);
      return NextResponse.json({ error: partsError.message }, { status: 400 });
    }

    return NextResponse.json(lesson);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create lesson";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
