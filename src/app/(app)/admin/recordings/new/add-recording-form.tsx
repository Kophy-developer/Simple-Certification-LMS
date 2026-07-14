"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/link-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isGoogleDriveUrl } from "@/lib/drive";
import type { Topic } from "@/types/database";
import { toast } from "sonner";

interface AddRecordingFormProps {
  topics: Topic[];
}

interface PartInput {
  title: string;
  driveUrl: string;
}

export function AddRecordingForm({ topics }: AddRecordingFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [topicId, setTopicId] = useState("");
  const [sessionDate, setSessionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [description, setDescription] = useState("");
  const [parts, setParts] = useState<PartInput[]>([
    { title: "Part 1", driveUrl: "" },
  ]);
  const [loading, setLoading] = useState(false);

  const updatePart = (index: number, patch: Partial<PartInput>) => {
    setParts((prev) =>
      prev.map((part, i) => (i === index ? { ...part, ...patch } : part))
    );
  };

  const addPart = () => {
    setParts((prev) => [
      ...prev,
      { title: `Part ${prev.length + 1}`, driveUrl: "" },
    ]);
  };

  const removePart = (index: number) => {
    setParts((prev) => {
      if (prev.length === 1) return prev;
      return prev
        .filter((_, i) => i !== index)
        .map((part, i) => ({
          ...part,
          title: part.title.match(/^Part \d+$/)
            ? `Part ${i + 1}`
            : part.title,
        }));
    });
  };

  const allPartsValid =
    parts.length > 0 &&
    parts.every((part) => part.driveUrl.trim() && isGoogleDriveUrl(part.driveUrl));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const toastId = toast.loading("Saving recording...");
    const response = await fetch("/api/admin/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        topicId,
        sessionDate,
        description: description || null,
        parts,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      toast.error(data.error ?? "Failed to add recording", { id: toastId });
      setLoading(false);
      return;
    }

    toast.success("Recording added", { id: toastId });
    router.push(`/lessons/${data.id}`);
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Recording</CardTitle>
        <CardDescription>
          Paste Google Drive links. Use multiple parts if the session was split
          into several videos. Share each file as Anyone with the link → Viewer.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Session 12 — Equity Valuation"
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
              <Label htmlFor="sessionDate">Session date</Label>
              <Input
                id="sessionDate"
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Google Drive parts</Label>
              <Button type="button" variant="outline" size="sm" onClick={addPart}>
                <Plus className="mr-1 h-4 w-4" />
                Add part
              </Button>
            </div>

            {parts.map((part, index) => (
              <div
                key={index}
                className="space-y-3 rounded-lg border bg-muted/20 p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <Input
                    value={part.title}
                    onChange={(e) => updatePart(index, { title: e.target.value })}
                    placeholder={`Part ${index + 1}`}
                    className="max-w-xs"
                  />
                  {parts.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removePart(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
                <Input
                  value={part.driveUrl}
                  onChange={(e) =>
                    updatePart(index, { driveUrl: e.target.value })
                  }
                  placeholder="https://drive.google.com/file/d/.../view"
                  required
                />
                {part.driveUrl && !isGoogleDriveUrl(part.driveUrl) && (
                  <p className="text-xs text-destructive">
                    Paste a Google Drive file link.
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was covered in this session?"
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={loading || !allPartsValid || !topicId}
            >
              {loading ? "Saving..." : "Save recording"}
            </Button>
            <LinkButton href="/admin" variant="outline">
              Cancel
            </LinkButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
