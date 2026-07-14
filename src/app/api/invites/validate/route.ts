import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: invite } = await admin
    .from("invites")
    .select("*")
    .eq("token", token)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .single();

  if (!invite) {
    return NextResponse.json(
      { error: "This invite is invalid or has expired." },
      { status: 404 }
    );
  }

  return NextResponse.json({ email: invite.email });
}
