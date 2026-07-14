# CFA Study LMS

A private, invite-only CFA study library. Admins paste public Google Drive recording links (one lesson can have multiple parts). Students log in on the web or the Flutter Android app and watch.

## Stack

- **Web:** Next.js, TypeScript, Tailwind, shadcn/ui
- **Mobile:** Flutter (local APK via `flutter build apk`)
- **Backend / auth:** Supabase
- **Video:** Public Google Drive links (Anyone with the link)

## Quick start

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run **both** migration files in order via the SQL Editor:
   - `supabase/migrations/20260709000000_initial_schema.sql`
   - `supabase/migrations/20260714000000_lesson_parts_drive.sql`
3. Copy project URL, anon key, and service role key

### 2. Environment

```bash
cp .env.local.example .env.local
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server only) |
| `SETUP_SECRET` | Random string for first admin setup |
| `NEXT_PUBLIC_APP_URL` | e.g. `http://localhost:3000` |

No Zoom or Google Cloud credentials required.

### 3. Run

```bash
npm install
npm run dev
```

Open `/setup` to create the first admin, then `/login`.

## Admin workflow

1. Get Drive links for the recording(s)
2. In Google Drive, set each file to **Anyone with the link → Viewer**
3. Admin → Add Recording → paste Part 1, Part 2, … → Save
4. Invite students under Manage Students

## Student workflow

1. Accept invite link and set a password
2. Home / Library → open a lesson → switch parts if needed

## Mobile app (Flutter APK)

See [`mobile/README.md`](mobile/README.md).

```bash
cd mobile
flutter build apk --release \
  --dart-define=SUPABASE_URL=https://YOUR_PROJECT.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=YOUR_ANON_KEY \
  --dart-define=API_URL=https://cfa-lms-ten.vercel.app
```

Install: `mobile/build/app/outputs/flutter-apk/app-release.apk`
