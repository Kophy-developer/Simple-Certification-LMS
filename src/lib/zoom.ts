interface ZoomRecording {
  id: string;
  meeting_id: string;
  recording_start: string;
  recording_end: string;
  file_type: string;
  file_size: number;
  play_url?: string;
  download_url?: string;
  status: string;
  recording_type: string;
}

interface ZoomRecordingsResponse {
  uuid: string;
  id: number;
  account_id: string;
  host_id: string;
  topic: string;
  start_time: string;
  duration: number;
  total_size: number;
  recording_count: number;
  share_url: string;
  recording_files: ZoomRecording[];
  password?: string;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getZoomAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.token;
  }

  const accountId = process.env.ZOOM_ACCOUNT_ID;
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;

  if (!accountId || !clientId || !clientSecret) {
    throw new Error("Zoom API credentials are not configured");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );

  const response = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get Zoom access token: ${error}`);
  }

  const data = await response.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return data.access_token;
}

export async function resolveZoomRecordingUrl(
  meetingId: string,
  passcode?: string | null
): Promise<{ url: string; durationSeconds?: number }> {
  const token = await getZoomAccessToken();

  const response = await fetch(
    `https://api.zoom.us/v2/meetings/${meetingId}/recordings`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch Zoom recordings: ${error}`);
  }

  const data: ZoomRecordingsResponse = await response.json();

  const videoFile =
    data.recording_files.find(
      (f) =>
        f.file_type === "MP4" &&
        (f.recording_type === "shared_screen_with_speaker_view" ||
          f.recording_type === "shared_screen_with_gallery_view" ||
          f.recording_type === "active_speaker" ||
          f.recording_type === "shared_screen")
    ) ?? data.recording_files.find((f) => f.file_type === "MP4");

  if (!videoFile) {
    throw new Error("No video recording found for this meeting");
  }

  let url = videoFile.download_url ?? videoFile.play_url;
  if (!url) {
    throw new Error("No playable URL found in Zoom recording");
  }

  if (passcode || data.password) {
    const separator = url.includes("?") ? "&" : "?";
    url = `${url}${separator}access_token=${token}`;
  }

  return {
    url,
    durationSeconds: data.duration * 60,
  };
}
