import {
  driveDownloadUrl,
  extractGoogleDriveFileId,
} from "@/lib/drive";

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
    /"downloadWarning"[^>]*value="([^"]+)"/,
    /uc-download-link[^>]+href="[^"]*confirm=([0-9A-Za-z_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1] && match[1] !== "t") return match[1];
  }

  return null;
}

export async function fetchPublicDriveStream(
  fileIdOrUrl: string,
  rangeHeader?: string | null
): Promise<Response> {
  const fileId = extractGoogleDriveFileId(fileIdOrUrl) ?? fileIdOrUrl;
  const headers: HeadersInit = {
    "User-Agent":
      "Mozilla/5.0 (compatible; CFA-Study-LMS/1.0; +https://localhost)",
  };
  if (rangeHeader) {
    headers.Range = rangeHeader;
  }

  let response = await fetch(driveDownloadUrl(fileId), {
    headers,
    redirect: "follow",
  });

  const contentType = response.headers.get("content-type") ?? "";
  const setCookie = response.headers.get("set-cookie");

  if (contentType.includes("text/html")) {
    const html = await response.text();
    const confirm = extractConfirmToken(html);
    const cookieHeader = parseCookies(setCookie);

    if (!confirm && !cookieHeader) {
      throw new Error(
        "Could not access this Drive file. Make sure it is shared as Anyone with the link → Viewer."
      );
    }

    const nextHeaders: HeadersInit = {
      ...headers,
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    };

    response = await fetch(driveDownloadUrl(fileId, confirm ?? "t"), {
      headers: nextHeaders,
      redirect: "follow",
    });
  }

  if (!response.ok && response.status !== 206) {
    throw new Error(
      `Drive download failed (${response.status}). Check the file is shared publicly.`
    );
  }

  const finalType = response.headers.get("content-type") ?? "";
  if (finalType.includes("text/html")) {
    throw new Error(
      "Google Drive blocked direct download for this file. Use preview mode or re-check sharing settings."
    );
  }

  return response;
}
