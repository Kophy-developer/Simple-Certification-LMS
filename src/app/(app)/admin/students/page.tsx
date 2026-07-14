import { createClient } from "@/lib/supabase/server";
import { ManageStudentsClient } from "./manage-students-client";
import type { Profile, Invite } from "@/types/database";

export default async function ManageStudentsPage() {
  const supabase = await createClient();

  const [{ data: students }, { data: invites }] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("role", "student")
      .order("created_at", { ascending: false }),
    supabase
      .from("invites")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <ManageStudentsClient
      students={(students ?? []) as Profile[]}
      invites={(invites ?? []) as Invite[]}
    />
  );
}
