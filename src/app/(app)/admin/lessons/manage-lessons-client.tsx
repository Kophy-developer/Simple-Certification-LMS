"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/link-button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { LessonWithTopic, Topic } from "@/types/database";
import { toast } from "sonner";

interface ManageLessonsClientProps {
  lessons: LessonWithTopic[];
  topics: Topic[];
}

export function ManageLessonsClient({
  lessons: initialLessons,
  topics,
}: ManageLessonsClientProps) {
  const router = useRouter();
  const [lessons, setLessons] = useState(initialLessons);
  const [editing, setEditing] = useState<LessonWithTopic | null>(null);
  const [deleting, setDeleting] = useState<LessonWithTopic | null>(null);

  const handleDelete = async () => {
    if (!deleting) return;

    const response = await fetch(`/api/admin/lessons/${deleting.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      toast.error("Failed to delete lesson");
      return;
    }

    setLessons((prev) => prev.filter((l) => l.id !== deleting.id));
    setDeleting(null);
    toast.success("Lesson deleted");
    router.refresh();
  };

  const handleSaveEdit = async () => {
    if (!editing) return;

    const response = await fetch(`/api/admin/lessons/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editing.title,
        description: editing.description,
        topicId: editing.topic_id,
        sessionDate: editing.session_date,
      }),
    });

    if (!response.ok) {
      toast.error("Failed to update lesson");
      return;
    }

    setLessons((prev) =>
      prev.map((l) =>
        l.id === editing.id
          ? {
              ...editing,
              topics: topics.find((t) => t.id === editing.topic_id)
                ? { id: editing.topic_id, name: topics.find((t) => t.id === editing.topic_id)!.name }
                : l.topics,
            }
          : l
      )
    );
    setEditing(null);
    toast.success("Lesson updated");
    router.refresh();
  };

  const grouped = topics
    .map((topic) => ({
      topic,
      lessons: lessons.filter((l) => l.topic_id === topic.id),
    }))
    .filter((g) => g.lessons.length > 0);

  return (
    <div className="space-y-6">
      <LinkButton href="/admin" variant="ghost" size="sm">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to admin
      </LinkButton>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Manage Lessons</h1>
        <p className="mt-1 text-muted-foreground">
          Edit or remove session recordings.
        </p>
      </div>

      {grouped.length === 0 ? (
        <p className="text-muted-foreground">No lessons yet.</p>
      ) : (
        grouped.map(({ topic, lessons: topicLessons }) => (
          <div key={topic.id}>
            <h2 className="mb-3 text-lg font-medium">{topic.name}</h2>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topicLessons.map((lesson) => (
                    <TableRow key={lesson.id}>
                      <TableCell className="font-medium">
                        {lesson.title}
                      </TableCell>
                      <TableCell>
                        {new Date(lesson.session_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{lesson.source_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setEditing(lesson)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setDeleting(lesson)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ))
      )}

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit lesson</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={editing.title}
                  onChange={(e) =>
                    setEditing({ ...editing, title: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Topic</Label>
                <select
                  className="flex h-9 w-full rounded-lg border bg-background px-3 text-sm"
                  value={editing.topic_id}
                  onChange={(e) =>
                    setEditing({ ...editing, topic_id: e.target.value })
                  }
                >
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Session date</Label>
                <Input
                  type="date"
                  value={editing.session_date}
                  onChange={(e) =>
                    setEditing({ ...editing, session_date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editing.description ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, description: e.target.value })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete lesson?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently remove &ldquo;{deleting?.title}&rdquo; and all
            student progress for it.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
