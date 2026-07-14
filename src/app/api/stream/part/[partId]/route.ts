import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchPublicDriveStream } from "@/lib/drive-stream";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ partId: string }> }
) {
  const { partId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: part } = await admin
    .from("lesson_parts")
    .select("*")
    .eq("id", partId)
    .single();

  if (!part) {
    return NextResponse.json({ error: "Part not found" }, { status: 404 });
  }

  try {
    const rangeHeader = request.headers.get("range");
    const driveResponse = await fetchPublicDriveStream(
      part.drive_file_id,
      rangeHeader
    );

    const headers = new Headers();
    headers.set(
      "Content-Type",
      driveResponse.headers.get("content-type") ?? "video/mp4"
    );
    headers.set("Accept-Ranges", "bytes");
    headers.set("Cache-Control", "private, max-age=0");

    const contentLength = driveResponse.headers.get("content-length");
    const contentRange = driveResponse.headers.get("content-range");
    if (contentLength) headers.set("Content-Length", contentLength);
    if (contentRange) headers.set("Content-Range", contentRange);

    return new NextResponse(driveResponse.body, {
      status: driveResponse.status,
      headers,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to stream video";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
