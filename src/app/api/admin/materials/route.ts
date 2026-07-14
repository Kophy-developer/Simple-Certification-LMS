import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MATERIAL_TOPICS_SELECT } from "@/lib/materials";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("materials")
    .select(MATERIAL_TOPICS_SELECT)
    .order("year", { ascending: false })
    .order("title");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data ?? []);
}

function parseTopicIds(form: FormData): string[] {
  const multi = form
    .getAll("topicIds")
    .map((value) => String(value).trim())
    .filter(Boolean);
  if (multi.length > 0) {
    return Array.from(new Set(multi));
  }

  const json = String(form.get("topicIdsJson") ?? "").trim();
  if (json) {
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed)) {
        return Array.from(
          new Set(parsed.map((id) => String(id).trim()).filter(Boolean))
        );
      }
    } catch {
      return [];
    }
  }

  const single = String(form.get("topicId") ?? "").trim();
  return single ? [single] : [];
}

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

  const form = await request.formData();
  const title = String(form.get("title") ?? "").trim();
  const topicIds = parseTopicIds(form);
  const yearRaw = String(form.get("year") ?? "").trim();
  const file = form.get("file");

  const year = Number(yearRaw);

  if (!title || topicIds.length === 0 || !Number.isInteger(year)) {
    return NextResponse.json(
      { error: "Title, at least one topic, and year are required" },
      { status: 400 }
    );
  }

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
  }

  if (file.type && file.type !== "application/pdf") {
    return NextResponse.json(
      { error: "Only PDF files are allowed" },
      { status: 400 }
    );
  }

  if (file.size > 50 * 1024 * 1024) {
    return NextResponse.json(
      { error: "PDF must be 50MB or smaller" },
      { status: 400 }
    );
  }

  const { count, error: topicCheckError } = await supabase
    .from("topics")
    .select("id", { count: "exact", head: true })
    .in("id", topicIds);

  if (topicCheckError || (count ?? 0) !== topicIds.length) {
    return NextResponse.json(
      { error: "One or more topics are invalid" },
      { status: 400 }
    );
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${year}/${Date.now()}-${safeName}`;
  const admin = createAdminClient();
  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await admin.storage
    .from("materials")
    .upload(filePath, bytes, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 400 });
  }

  const { data: material, error } = await admin
    .from("materials")
    .insert({
      year,
      title,
      file_path: filePath,
      file_name: file.name,
      file_size: file.size,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !material) {
    await admin.storage.from("materials").remove([filePath]);
    return NextResponse.json(
      { error: error?.message || `database error, code: ${error?.code}` },
      { status: 400 }
    );
  }

  const { error: linkError } = await admin.from("material_topics").insert(
    topicIds.map((topicId) => ({
      material_id: material.id,
      topic_id: topicId,
    }))
  );

  if (linkError) {
    await admin.from("materials").delete().eq("id", material.id);
    await admin.storage.from("materials").remove([filePath]);
    return NextResponse.json({ error: linkError.message }, { status: 400 });
  }

  const { data: full, error: fetchError } = await admin
    .from("materials")
    .select(MATERIAL_TOPICS_SELECT)
    .eq("id", material.id)
    .single();

  if (fetchError || !full) {
    return NextResponse.json(
      { error: fetchError?.message ?? "Uploaded but failed to load material" },
      { status: 400 }
    );
  }

  return NextResponse.json(full);
}
