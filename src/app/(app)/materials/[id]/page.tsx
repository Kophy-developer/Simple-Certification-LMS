import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  MATERIAL_TOPICS_SELECT,
  materialTopicNames,
} from "@/lib/materials";
import type { MaterialWithTopic } from "@/types/database";
import { PdfReaderClient } from "./pdf-reader-client";

export default async function MaterialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: material } = await supabase
    .from("materials")
    .select(MATERIAL_TOPICS_SELECT)
    .eq("id", id)
    .single();

  if (!material) notFound();

  const typed = material as MaterialWithTopic;
  const topicNames = (typed.material_topics ?? [])
    .map((link) => link.topics?.name)
    .filter((name): name is string => Boolean(name))
    .sort((a, b) => a.localeCompare(b));

  return (
    <PdfReaderClient
      materialId={typed.id}
      title={typed.title}
      year={typed.year}
      topicNames={topicNames.length > 0 ? topicNames : [materialTopicNames(typed)]}
      fileName={typed.file_name}
    />
  );
}
