import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
    .select("*, topics(id, name)")
    .eq("id", id)
    .single();

  if (!material) notFound();

  return (
    <PdfReaderClient
      materialId={material.id}
      title={material.title}
      year={material.year}
      topicName={material.topics?.name ?? "Topic"}
      fileName={material.file_name}
    />
  );
}
