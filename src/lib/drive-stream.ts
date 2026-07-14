import {
  driveDownloadUrl,
  extractGoogleDriveFileId,
} from "@/lib/drive";

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

function parseCookies(header: string | null): string {
  if (!header) return "";
  return header
    .split(/,(?=\s*[^;]+=)/)
    .map((part) => part.split(";")[0].trim())
    .filter(Boolean)
    .join("; ");
}

function extractConfirmToken(html: string): string | null {
  const patterns = [
    /confirm=([0-9A-Za-z_-]+)/,
    /name="confirm"\s+value="([^"]+)"/,
    /"confirm"\s*,\s*"([0-9A-Za-z_-]+)"/,
    /uc-download-link[^>]+href="[^"]*confirm=([0-9A-Za-z_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

function isHtml(response: Response): boolean {
  const type = response.headers.get("content-type") ?? "";
  return type.includes("text/html");
}

function isMedia(response: Response): boolean {
  if (!response.ok && response.status !== 206) return false;
  const type = response.headers.get("content-type") ?? "";
  if (isHtml(response)) return false;
  return (
    type.includes("video") ||
    type.includes("audio") ||
    type.includes("octet-stream") ||
    type.includes("mp4") ||
    type === "" ||
    Boolean(response.headers.get("content-length")) ||
    Boolean(response.headers.get("content-range"))
  );
}

async function fetchUrl(
  url: string,
  rangeHeader?: string | null,
  cookieHeader?: string
): Promise<Response> {
  const headers: HeadersInit = {
    "User-Agent": BROWSER_UA,
    Accept: "*/*",
    "Accept-Language": "en-US,en;q=0.9",
  };
  if (rangeHeader) headers.Range = rangeHeader;
  if (cookieHeader) headers.Cookie = cookieHeader;

  return fetch(url, {
    headers,
    redirect: "follow",
  });
}

function candidateUrls(fileId: string, confirm = "t"): string[] {
  return [
    `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=${confirm}`,
    `https://drive.google.com/uc?export=download&id=${fileId}&confirm=${confirm}`,
    driveDownloadUrl(fileId, confirm),
    `https://drive.google.com/uc?id=${fileId}&export=download`,
  ];
}

async function fetchViaApiKey(
  fileId: string,
  rangeHeader?: string | null
): Promise<Response | null> {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
  if (!apiKey) return null;

  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}&supportsAllDrives=true`;
  const response = await fetchUrl(url, rangeHeader);
  if (isMedia(response)) return response;
  return null;
}

export async function fetchPublicDriveStream(
  fileIdOrUrl: string,
  rangeHeader?: string | null
): Promise<Response> {
  const fileId = extractGoogleDriveFileId(fileIdOrUrl) ?? fileIdOrUrl;

  const viaKey = await fetchViaApiKey(fileId, rangeHeader);
  if (viaKey) return viaKey;

  let cookieHeader = "";
  let lastError = "Unable to download Drive media";

  for (const url of candidateUrls(fileId, "t")) {
    let response = await fetchUrl(url, rangeHeader, cookieHeader || undefined);

    if (isMedia(response)) return response;

    if (isHtml(response)) {
      const html = await response.text();
      cookieHeader =
        [cookieHeader, parseCookies(response.headers.get("set-cookie"))]
          .filter(Boolean)
          .join("; ") || cookieHeader;
      const confirm = extractConfirmToken(html) ?? "t";

      for (const retryUrl of candidateUrls(fileId, confirm)) {
        response = await fetchUrl(
          retryUrl,
          rangeHeader,
          cookieHeader || undefined
        );
        if (isMedia(response)) return response;
        if (isHtml(response)) {
          cookieHeader =
            [cookieHeader, parseCookies(response.headers.get("set-cookie"))]
              .filter(Boolean)
              .join("; ") || cookieHeader;
        } else if (!response.ok && response.status !== 206) {
          lastError = `Drive download failed (${response.status})`;
        }
      }
    } else if (!response.ok && response.status !== 206) {
      lastError = `Drive download failed (${response.status})`;
    }
  }

  throw new Error(
    `${lastError}. Share the file as Anyone with the link → Viewer, or set GOOGLE_DRIVE_API_KEY on Vercel.`
  );
}
