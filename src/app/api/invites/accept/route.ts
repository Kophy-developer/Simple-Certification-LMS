import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const { token, name, password } = await request.json();

  if (!token || !name || !password) {
    return NextResponse.json(
      { error: "Token, name, and password are required" },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
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

  const { data: existingUser } = await admin
    .from("profiles")
    .select("id")
    .eq("email", invite.email)
    .single();

  if (existingUser) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 400 }
    );
  }

  const { data: user, error: createError } = await admin.auth.admin.createUser({
    email: invite.email,
    password,
    email_confirm: true,
    app_metadata: { role: "student" },
    user_metadata: {
      name,
      invited_by: invite.created_by,
    },
  });

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 400 });
  }

  await admin
    .from("profiles")
    .update({ name, invited_by: invite.created_by })
    .eq("id", user.user.id);

  await admin
    .from("invites")
    .update({ status: "accepted" })
    .eq("id", invite.id);

  return NextResponse.json({ success: true });
}
