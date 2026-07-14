# CFA Study — Flutter app

Android (and iOS) client for the CFA Study LMS. Login uses the same Supabase project as the website. Videos stream from your Vercel API with a Bearer token.

## Requirements

- Flutter SDK 3.11+ (`flutter doctor`)
- Android Studio / Android SDK (for APK)
- Your Supabase **Project URL** and **anon key**
- API URL (default): `https://cfa-lms-ten.vercel.app`

## Run on a device / emulator

```bash
cd mobile

flutter run \
  --dart-define=SUPABASE_URL=https://YOUR_PROJECT.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=YOUR_ANON_KEY \
  --dart-define=API_URL=https://cfa-lms-ten.vercel.app
```

## Build a release APK (local)

```bash
cd mobile

flutter build apk --release \
  --dart-define=SUPABASE_URL=https://YOUR_PROJECT.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=YOUR_ANON_KEY \
  --dart-define=API_URL=https://cfa-lms-ten.vercel.app
```

APK path:

```text
mobile/build/app/outputs/flutter-apk/app-release.apk
```

Copy that file to your phone and install it (enable “Install from unknown sources” if prompted).

### Smaller split APKs (optional)

```bash
flutter build apk --split-per-abi --release \
  --dart-define=SUPABASE_URL=... \
  --dart-define=SUPABASE_ANON_KEY=... \
  --dart-define=API_URL=https://cfa-lms-ten.vercel.app
```

## App features

- Email / password login (Supabase Auth)
- Bottom nav: **Home**, **Library**, **Progress**
- Lesson screen with **multi-part** videos
- Stream: `{API_URL}/api/stream/part/{partId}` + `Authorization: Bearer <token>`
- Falls back to Google Drive preview WebView if streaming fails
- Progress sync to `{API_URL}/api/progress`

## Design

Navy / cream palette aligned with the web CFA Study LMS. DM Sans via `google_fonts`.

## Notes

- Create student accounts via the **website** invite flow; this app only signs in existing users.
- Drive files must remain shared as **Anyone with the link → Viewer**.
