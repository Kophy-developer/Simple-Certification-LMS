import { createClient } from "@/lib/supabase/server";
import { ManageTopicsClient } from "./manage-topics-client";
import type { Topic } from "@/types/database";

export default async function ManageTopicsPage() {
  const supabase = await createClient();
  const { data: topics } = await supabase
    .from("topics")
    .select("*")
    .order("sort_order");

  return <ManageTopicsClient topics={(topics ?? []) as Topic[]} />;
}
