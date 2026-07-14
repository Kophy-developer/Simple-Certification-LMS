import type { MaterialWithTopic } from "@/types/database";

export function materialTopicNames(material: MaterialWithTopic): string {
  const names = (material.material_topics ?? [])
    .map((link) => link.topics?.name)
    .filter((name): name is string => Boolean(name))
    .sort((a, b) => a.localeCompare(b));
  return names.length > 0 ? names.join(", ") : "Topic";
}

export function materialHasTopic(
  material: MaterialWithTopic,
  topicId: string
): boolean {
  return (material.material_topics ?? []).some(
    (link) => link.topic_id === topicId
  );
}

export const MATERIAL_TOPICS_SELECT =
  "*, material_topics(topic_id, topics(id, name))";
