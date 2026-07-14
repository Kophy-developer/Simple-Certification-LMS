import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/link-button";
import { AddRecordingForm } from "./add-recording-form";
import type { Topic } from "@/types/database";

export default async function NewRecordingPage() {
  const supabase = await createClient();
  const { data: topics } = await supabase
    .from("topics")
    .select("*")
    .order("sort_order");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <LinkButton href="/admin" variant="ghost" size="sm">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to admin
      </LinkButton>
      <AddRecordingForm topics={(topics ?? []) as Topic[]} />
    </div>
  );
}
