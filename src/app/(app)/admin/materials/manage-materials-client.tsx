"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { LinkButton } from "@/components/link-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MaterialWithTopic, Topic } from "@/types/database";

interface ManageMaterialsClientProps {
  topics: Topic[];
  materials: MaterialWithTopic[];
}

function formatBytes(size: number | null): string {
  if (!size) return "";
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function ManageMaterialsClient({
  topics,
  materials: initialMaterials,
}: ManageMaterialsClientProps) {
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const years = useMemo(
    () => Array.from({ length: 12 }, (_, i) => currentYear - i),
    [currentYear]
  );

  const [materials, setMaterials] = useState(initialMaterials);
  const [title, setTitle] = useState("");
  const [topicId, setTopicId] = useState("");
  const [year, setYear] = useState(String(currentYear));
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterYear, setFilterYear] = useState<string>("all");

  const grouped = useMemo(() => {
    const filtered =
      filterYear === "all"
        ? materials
        : materials.filter((m) => String(m.year) === filterYear);

    const map = new Map<
      string,
      { topicName: string; year: number; items: MaterialWithTopic[] }
    >();

    for (const material of filtered) {
      const key = `${material.topic_id}-${material.year}`;
      const existing = map.get(key);
      if (existing) {
        existing.items.push(material);
      } else {
        map.set(key, {
          topicName: material.topics?.name ?? "Topic",
          year: material.year,
          items: [material],
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return a.topicName.localeCompare(b.topicName);
    });
  }, [materials, filterYear]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !topicId || !title.trim()) return;

    setLoading(true);
    const form = new FormData();
    form.set("title", title.trim());
    form.set("topicId", topicId);
    form.set("year", year);
    form.set("file", file);

    const response = await fetch("/api/admin/materials", {
      method: "POST",
      body: form,
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      toast.error(data.error ?? "Upload failed");
      return;
    }

    setMaterials((prev) => [data, ...prev]);
    setTitle("");
    setFile(null);
    toast.success("PDF uploaded");
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    const response = await fetch(`/api/admin/materials/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const data = await response.json();
      toast.error(data.error ?? "Delete failed");
      return;
    }
    setMaterials((prev) => prev.filter((m) => m.id !== id));
    toast.success("Material deleted");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <LinkButton href="/admin" variant="ghost" size="sm">
        Back to admin
      </LinkButton>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Topic PDFs</h1>
        <p className="mt-1 text-muted-foreground">
          Upload PDFs by CFA topic and year (notes, past papers, summaries).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Upload className="h-5 w-5" />
            Upload PDF
          </CardTitle>
          <CardDescription>
            Choose the topic and the year the material belongs to.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="materialTitle">Title</Label>
              <Input
                id="materialTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Equity — 2023 curriculum notes"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Topic</Label>
                <Select
                  value={topicId}
                  onValueChange={(value) => setTopicId(value ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {topics.map((topic) => (
                      <SelectItem key={topic.id} value={topic.id}>
                        {topic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Select
                  value={year}
                  onValueChange={(value) => setYear(value ?? String(currentYear))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pdf">PDF file</Label>
              <Input
                id="pdf"
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !file || !topicId || !title.trim()}
            >
              {loading ? "Uploading..." : "Upload PDF"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Filter by year</span>
        <Button
          type="button"
          size="sm"
          variant={filterYear === "all" ? "default" : "outline"}
          onClick={() => setFilterYear("all")}
        >
          All
        </Button>
        {years.slice(0, 8).map((y) => (
          <Button
            key={y}
            type="button"
            size="sm"
            variant={filterYear === String(y) ? "default" : "outline"}
            onClick={() => setFilterYear(String(y))}
          >
            {y}
          </Button>
        ))}
      </div>

      {grouped.length === 0 ? (
        <p className="text-sm text-muted-foreground">No PDFs uploaded yet.</p>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <section key={`${group.topicName}-${group.year}`}>
              <h2 className="mb-3 text-lg font-medium">
                {group.topicName} · {group.year}
              </h2>
              <div className="space-y-2">
                {group.items.map((material) => (
                  <div
                    key={material.id}
                    className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <FileText className="h-5 w-5 shrink-0 text-primary" />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{material.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {material.file_name}
                          {material.file_size
                            ? ` · ${formatBytes(material.file_size)}`
                            : ""}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(material.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
