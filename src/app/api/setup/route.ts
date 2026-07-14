import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const { name, email, password, setupKey } = await request.json();

  if (!process.env.SETUP_SECRET) {
    return NextResponse.json(
      { error: "Setup is not configured. Set SETUP_SECRET in environment." },
      { status: 500 }
    );
  }

  if (setupKey !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: "Invalid setup key" }, { status: 403 });
  }

  const admin = createAdminClient();

  const { count } = await admin
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "admin");

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: "An admin account already exists" },
      { status: 400 }
    );
  }

  const { data: user, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: "admin" },
    user_metadata: { name },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await admin
    .from("profiles")
    .update({ role: "admin", name })
    .eq("id", user.user.id);

  return NextResponse.json({ success: true });
}
