"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, FolderOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import type { LessonWithTopic, Topic } from "@/types/database";

interface LibraryPageProps {
  topics: Topic[];
  lessons: LessonWithTopic[];
}

export function LibraryClient({ topics, lessons }: LibraryPageProps) {
  const [search, setSearch] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return lessons.filter((lesson) => {
      const matchesSearch =
        !search ||
        lesson.title.toLowerCase().includes(search.toLowerCase()) ||
        lesson.description?.toLowerCase().includes(search.toLowerCase());
      const matchesTopic =
        !selectedTopic || lesson.topic_id === selectedTopic;
      return matchesSearch && matchesTopic;
    });
  }, [lessons, search, selectedTopic]);

  const grouped = useMemo(() => {
    const map = new Map<string, { topic: Topic; lessons: LessonWithTopic[] }>();

    for (const topic of topics) {
      map.set(topic.id, { topic, lessons: [] });
    }

    for (const lesson of filtered) {
      const group = map.get(lesson.topic_id);
      if (group) {
        group.lessons.push(lesson);
      }
    }

    return Array.from(map.values()).filter((g) => g.lessons.length > 0);
  }, [topics, filtered]);

  if (lessons.length === 0) {
    return (
      <EmptyState
        icon={FolderOpen}
        title="Library is empty"
        description="Session recordings will be organized by CFA topic once they're added."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Library</h1>
        <p className="mt-1 text-muted-foreground">
          Browse recordings by CFA curriculum topic.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedTopic === null ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedTopic(null)}
          >
            All topics
          </Badge>
          {topics.map((topic) => (
            <Badge
              key={topic.id}
              variant={selectedTopic === topic.id ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() =>
                setSelectedTopic(
                  selectedTopic === topic.id ? null : topic.id
                )
              }
            >
              {topic.name}
            </Badge>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No results"
          description="Try a different search term or clear your filters."
          action={{
            label: "Clear search",
            href: "#",
          }}
          className="[&_a]:hidden"
        />
      ) : (
        <div className="space-y-8">
          {grouped.map(({ topic, lessons: topicLessons }) => (
            <section key={topic.id}>
              <h2 className="mb-3 text-lg font-medium">{topic.name}</h2>
              <div className="grid gap-2">
                {topicLessons.map((lesson) => (
                  <Link key={lesson.id} href={`/lessons/${lesson.id}`}>
                    <Card className="transition-colors hover:border-primary/40 hover:bg-muted/30">
                      <CardContent className="flex items-center justify-between p-4">
                        <div>
                          <p className="font-medium">{lesson.title}</p>
                          {lesson.description && (
                            <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                              {lesson.description}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {new Date(lesson.session_date).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" }
                          )}
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {filtered.length === 0 && search && (
        <div className="text-center">
          <button
            onClick={() => {
              setSearch("");
              setSelectedTopic(null);
            }}
            className="text-sm text-primary hover:underline"
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  );
}
