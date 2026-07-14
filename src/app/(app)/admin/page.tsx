import Link from "next/link";
import { Plus, Users, FolderOpen, ListVideo, BarChart3 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/link-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    { count: lessonCount },
    { count: studentCount },
    { count: topicCount },
    { data: recentLessons },
  ] = await Promise.all([
    supabase.from("lessons").select("*", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "student"),
    supabase.from("topics").select("*", { count: "exact", head: true }),
    supabase
      .from("lessons")
      .select("id, title, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const links = [
    {
      href: "/admin/recordings/new",
      label: "Add Recording",
      description: "Paste Google Drive links (multi-part OK)",
      icon: Plus,
      primary: true,
    },
    {
      href: "/admin/lessons",
      label: "Manage Lessons",
      description: "Edit, reorder, or delete recordings",
      icon: ListVideo,
    },
    {
      href: "/admin/topics",
      label: "Manage Topics",
      description: "Organize CFA curriculum areas",
      icon: FolderOpen,
    },
    {
      href: "/admin/students",
      label: "Manage Students",
      description: "Send invites and manage access",
      icon: Users,
    },
    {
      href: "/admin/engagement",
      label: "Engagement",
      description: "See who's watching what",
      icon: BarChart3,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
          <p className="mt-1 text-muted-foreground">
            Manage recordings and your study group.
          </p>
        </div>
        <LinkButton href="/admin/recordings/new">
          <Plus className="mr-2 h-4 w-4" />
          Add recording
        </LinkButton>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lessons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{lessonCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{studentCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Topics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{topicCount ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {links.map(({ href, label, description, icon: Icon, primary }) => (
          <Link key={href} href={href}>
            <Card
              className={
                primary
                  ? "border-primary/30 bg-primary/5 transition-colors hover:border-primary/50"
                  : "transition-colors hover:border-primary/30"
              }
            >
              <CardContent className="flex items-start gap-4 p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {recentLessons && recentLessons.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-medium">Recently added</h2>
          <div className="space-y-2">
            {recentLessons.map((lesson) => (
              <div
                key={lesson.id}
                className="flex items-center justify-between rounded-lg border px-4 py-3"
              >
                <span className="font-medium">{lesson.title}</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(lesson.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
