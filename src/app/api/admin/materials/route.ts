import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    .select("*, topics(id, name)")
    .order("year", { ascending: false })
    .order("title");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data ?? []);
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
  const topicId = String(form.get("topicId") ?? "").trim();
  const yearRaw = String(form.get("year") ?? "").trim();
  const file = form.get("file");

  const year = Number(yearRaw);

  if (!title || !topicId || !Number.isInteger(year)) {
    return NextResponse.json(
      { error: "Title, topic, and year are required" },
      { status: 400 }
    );
  }

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
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

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${topicId}/${year}/${Date.now()}-${safeName}`;

  const bytes = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from("materials")
    .upload(filePath, bytes, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 400 });
  }

  const { data: material, error } = await supabase
    .from("materials")
    .insert({
      topic_id: topicId,
      year,
      title,
      file_path: filePath,
      file_name: file.name,
      file_size: file.size,
      created_by: user.id,
    })
    .select("*, topics(id, name)")
    .single();

  if (error) {
    await supabase.storage.from("materials").remove([filePath]);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(material);
}
