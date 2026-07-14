"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, FileText, FolderOpen, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { LinkButton } from "@/components/link-button";
import {
  materialHasTopic,
  materialTopicNames,
} from "@/lib/materials";
import type { LessonWithTopic, MaterialWithTopic, Topic } from "@/types/database";
import { toast } from "sonner";

interface LibraryPageProps {
  topics: Topic[];
  lessons: LessonWithTopic[];
  materials: MaterialWithTopic[];
}

export function LibraryClient({
  topics,
  lessons,
  materials,
}: LibraryPageProps) {
  const [search, setSearch] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);

  const years = useMemo(() => {
    const set = new Set(materials.map((m) => m.year));
    return Array.from(set).sort((a, b) => b - a);
  }, [materials]);

  const filteredLessons = useMemo(() => {
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

  const filteredMaterials = useMemo(() => {
    return materials.filter((material) => {
      const matchesSearch =
        !search ||
        material.title.toLowerCase().includes(search.toLowerCase()) ||
        material.file_name.toLowerCase().includes(search.toLowerCase());
      const matchesTopic =
        !selectedTopic || materialHasTopic(material, selectedTopic);
      const matchesYear =
        selectedYear == null || material.year === selectedYear;
      return matchesSearch && matchesTopic && matchesYear;
    });
  }, [materials, search, selectedTopic, selectedYear]);

  const groupedLessons = useMemo(() => {
    const map = new Map<string, { topic: Topic; lessons: LessonWithTopic[] }>();
    for (const topic of topics) {
      map.set(topic.id, { topic, lessons: [] });
    }
    for (const lesson of filteredLessons) {
      map.get(lesson.topic_id)?.lessons.push(lesson);
    }
    return Array.from(map.values()).filter((g) => g.lessons.length > 0);
  }, [topics, filteredLessons]);

  const groupedMaterials = useMemo(() => {
    const map = new Map<
      string,
      { topicName: string; year: number; items: MaterialWithTopic[] }
    >();
    for (const material of filteredMaterials) {
      const topicName = materialTopicNames(material);
      const key = `${topicName}-${material.year}`;
      const existing = map.get(key);
      if (existing) {
        existing.items.push(material);
      } else {
        map.set(key, {
          topicName,
          year: material.year,
          items: [material],
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return a.topicName.localeCompare(b.topicName);
    });
  }, [filteredMaterials]);

  const downloadPdf = async (id: string) => {
    setOpeningId(id);
    try {
      const response = await fetch(`/api/materials/${id}/download?mode=download`);
      const data = await response.json();
      if (!response.ok || !data.url) {
        toast.error(data.error ?? "Could not download PDF");
        return;
      }
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Could not download PDF");
    } finally {
      setOpeningId(null);
    }
  };

  if (lessons.length === 0 && materials.length === 0) {
    return (
      <EmptyState
        icon={FolderOpen}
        title="Library is empty"
        description="Session recordings and topic PDFs will appear here once they're added."
      />
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Library</h1>
        <p className="mt-1 text-muted-foreground">
          Recordings and PDF materials by CFA topic and year.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search lessons or PDFs..."
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
                setSelectedTopic(selectedTopic === topic.id ? null : topic.id)
              }
            >
              {topic.name}
            </Badge>
          ))}
        </div>
        {years.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedYear === null ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedYear(null)}
            >
              All years
            </Badge>
            {years.map((year) => (
              <Badge
                key={year}
                variant={selectedYear === year ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() =>
                  setSelectedYear(selectedYear === year ? null : year)
                }
              >
                {year}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Recordings</h2>
        {filteredLessons.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recordings match.</p>
        ) : (
          <div className="space-y-8">
            {groupedLessons.map(({ topic, lessons: topicLessons }) => (
              <div key={topic.id}>
                <h3 className="mb-3 font-medium text-muted-foreground">
                  {topic.name}
                </h3>
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
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </span>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">PDF materials</h2>
        {filteredMaterials.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No PDFs for this filter yet.
          </p>
        ) : (
          <div className="space-y-6">
            {groupedMaterials.map((group) => (
              <div key={`${group.topicName}-${group.year}`}>
                <h3 className="mb-3 font-medium text-muted-foreground">
                  {group.topicName} · {group.year}
                </h3>
                <div className="grid gap-2">
                  {group.items.map((material) => (
                    <Card key={material.id}>
                      <CardContent className="flex items-center justify-between gap-3 p-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <FileText className="h-5 w-5 shrink-0 text-primary" />
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {material.title}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {material.file_name}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <LinkButton
                            href={`/materials/${material.id}`}
                            size="sm"
                          >
                            Read
                          </LinkButton>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => downloadPdf(material.id)}
                            disabled={openingId === material.id}
                          >
                            <Download className="mr-1.5 h-4 w-4" />
                            {openingId === material.id ? "..." : "Download"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
