export type UserRole = "admin" | "student";

export type InviteStatus = "pending" | "accepted" | "expired" | "revoked";

export type SourceType =
  | "zoom"
  | "google_meet"
  | "google_drive"
  | "manual_upload";

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  invited_by: string | null;
  created_at: string;
}

export interface Invite {
  id: string;
  email: string;
  token: string;
  status: InviteStatus;
  expires_at: string;
  created_by: string;
  created_at: string;
}

export interface Topic {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface LessonPart {
  id: string;
  lesson_id: string;
  title: string;
  drive_file_id: string;
  drive_url: string;
  sort_order: number;
  duration_seconds: number | null;
  created_at: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string | null;
  topic_id: string;
  session_date: string;
  source_type: SourceType;
  source_ref: string | null;
  video_source_url: string | null;
  passcode: string | null;
  duration_seconds: number | null;
  sort_order: number;
  created_by: string;
  created_at: string;
}

export interface LessonWithTopic extends Lesson {
  topics: Pick<Topic, "id" | "name"> | null;
  lesson_parts?: LessonPart[];
}

export interface Progress {
  id: string;
  user_id: string;
  lesson_id: string;
  lesson_part_id: string | null;
  watched_seconds: number;
  completed: boolean;
  last_watched_at: string;
}

export interface ProgressWithLesson extends Progress {
  lessons: LessonWithTopic | null;
}

export interface Material {
  id: string;
  year: number;
  title: string;
  file_path: string;
  file_name: string;
  file_size: number | null;
  created_by: string;
  created_at: string;
}

export interface MaterialTopicLink {
  topic_id: string;
  topics: Pick<Topic, "id" | "name"> | null;
}

export interface MaterialWithTopic extends Material {
  material_topics: MaterialTopicLink[];
}
