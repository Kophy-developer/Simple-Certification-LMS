import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/request-user";
import { fetchPublicDriveStream } from "@/lib/drive-stream";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ partId: string }> }
) {
  const { partId } = await params;
  const user = await getRequestUser(request);

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
    let driveResponse: Response;

    try {
      driveResponse = await fetchPublicDriveStream(
        part.drive_file_id,
        rangeHeader
      );
    } catch (rangeError) {
      if (!rangeHeader) throw rangeError;
      driveResponse = await fetchPublicDriveStream(part.drive_file_id, null);
    }

    const upstreamType = driveResponse.headers.get("content-type") ?? "";
    const contentType =
      upstreamType.includes("video") || upstreamType.includes("mp4")
        ? upstreamType
        : "video/mp4";

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Accept-Ranges", "bytes");
    headers.set("Cache-Control", "private, max-age=0");

    const contentLength = driveResponse.headers.get("content-length");
    const contentRange = driveResponse.headers.get("content-range");
    if (contentLength) headers.set("Content-Length", contentLength);
    if (contentRange) headers.set("Content-Range", contentRange);

    return new NextResponse(driveResponse.body, {
      status: contentRange ? driveResponse.status : rangeHeader && !contentRange ? 200 : driveResponse.status,
      headers,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to stream video";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
