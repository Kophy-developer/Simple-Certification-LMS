import { createClient } from "@/lib/supabase/server";
import { ManageMaterialsClient } from "./manage-materials-client";
import type { MaterialWithTopic, Topic } from "@/types/database";

export default async function AdminMaterialsPage() {
  const supabase = await createClient();

  const [{ data: topics }, { data: materials }] = await Promise.all([
    supabase.from("topics").select("*").order("sort_order"),
    supabase
      .from("materials")
      .select("*, topics(id, name)")
      .order("year", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  return (
    <ManageMaterialsClient
      topics={(topics ?? []) as Topic[]}
      materials={(materials ?? []) as MaterialWithTopic[]}
    />
  );
}
