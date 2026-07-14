"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, GripVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/link-button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Topic } from "@/types/database";
import { toast } from "sonner";

interface ManageTopicsClientProps {
  topics: Topic[];
}

export function ManageTopicsClient({ topics: initialTopics }: ManageTopicsClientProps) {
  const router = useRouter();
  const [topics, setTopics] = useState(initialTopics);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleAdd = async () => {
    if (!newName.trim()) return;

    const response = await fetch("/api/admin/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });

    const data = await response.json();
    if (!response.ok) {
      toast.error(data.error ?? "Failed to add topic");
      return;
    }

    setTopics((prev) => [...prev, data]);
    setNewName("");
    setAdding(false);
    toast.success("Topic added");
    router.refresh();
  };

  const handleRename = async (id: string) => {
    if (!editName.trim()) return;

    const response = await fetch(`/api/admin/topics/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim() }),
    });

    if (!response.ok) {
      toast.error("Failed to rename topic");
      return;
    }

    setTopics((prev) =>
      prev.map((t) => (t.id === id ? { ...t, name: editName.trim() } : t))
    );
    setEditingId(null);
    toast.success("Topic renamed");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <LinkButton href="/admin" variant="ghost" size="sm">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to admin
      </LinkButton>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Manage Topics</h1>
          <p className="mt-1 text-muted-foreground">
            CFA curriculum areas for organizing recordings.
          </p>
        </div>
        <Button onClick={() => setAdding(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add topic
        </Button>
      </div>

      <div className="space-y-2">
        {topics.map((topic) => (
          <div
            key={topic.id}
            className="flex items-center gap-3 rounded-lg border px-4 py-3"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            {editingId === topic.id ? (
              <form
                className="flex flex-1 gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRename(topic.id);
                }}
              >
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1"
                  autoFocus
                />
                <Button type="submit" size="sm">
                  Save
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingId(null)}
                >
                  Cancel
                </Button>
              </form>
            ) : (
              <>
                <span className="flex-1 font-medium">{topic.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingId(topic.id);
                    setEditName(topic.name);
                  }}
                >
                  Rename
                </Button>
              </>
            )}
          </div>
        ))}
      </div>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add topic</DialogTitle>
          </DialogHeader>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Topic name"
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
