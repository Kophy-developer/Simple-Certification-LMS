"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/link-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Profile, Invite } from "@/types/database";
import { toast } from "sonner";

interface ManageStudentsClientProps {
  students: Profile[];
  invites: Invite[];
}

export function ManageStudentsClient({
  students,
  invites: initialInvites,
}: ManageStudentsClientProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [invites, setInvites] = useState(initialInvites);
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const response = await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      toast.error(data.error ?? "Failed to send invite");
      setLoading(false);
      return;
    }

    setInvites((prev) => [data.invite, ...prev]);
    setLastInviteLink(data.inviteLink);
    setEmail("");
    setLoading(false);
    toast.success("Invite created");
    router.refresh();
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success("Invite link copied");
  };

  const handleRevoke = async (inviteId: string) => {
    const response = await fetch(`/api/invites/${inviteId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      toast.error("Failed to revoke invite");
      return;
    }

    setInvites((prev) =>
      prev.map((i) =>
        i.id === inviteId ? { ...i, status: "revoked" as const } : i
      )
    );
    toast.success("Invite revoked");
    router.refresh();
  };

  const pendingInvites = invites.filter((i) => i.status === "pending");

  return (
    <div className="space-y-6">
      <LinkButton href="/admin" variant="ghost" size="sm">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to admin
      </LinkButton>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Manage Students</h1>
        <p className="mt-1 text-muted-foreground">
          Invite study group members and manage access.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Send invite
          </CardTitle>
          <CardDescription>
            Generate an invite link for a new student.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="flex gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="inviteEmail">Email address</Label>
              <Input
                id="inviteEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                required
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={loading}>
                {loading ? "Sending..." : "Create invite"}
              </Button>
            </div>
          </form>
          {lastInviteLink && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted p-3">
              <code className="flex-1 truncate text-xs">{lastInviteLink}</code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyLink(lastInviteLink)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-3 text-lg font-medium">
          Active students ({students.length})
        </h2>
        {students.length === 0 ? (
          <p className="text-sm text-muted-foreground">No students yet.</p>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>
                      {new Date(student.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {pendingInvites.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-medium">Pending invites</h2>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell>{invite.email}</TableCell>
                    <TableCell>
                      {new Date(invite.expires_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{invite.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevoke(invite.id)}
                      >
                        Revoke
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}
    </div>
  );
}
