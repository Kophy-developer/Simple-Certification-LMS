import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: material } = await supabase
    .from("materials")
    .select("file_path, file_name")
    .eq("id", id)
    .single();

  if (!material) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data, error } = await supabase.storage
    .from("materials")
    .createSignedUrl(material.file_path, 60 * 60, {
      download: material.file_name,
    });

  if (error || !data?.signedUrl) {
    return NextResponse.json(
      { error: error?.message ?? "Could not create download link" },
      { status: 400 }
    );
  }

  return NextResponse.json({ url: data.signedUrl });
}
