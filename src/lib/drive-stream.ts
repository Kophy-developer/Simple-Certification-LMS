import {
  driveDownloadUrl,
  extractGoogleDriveFileId,
} from "@/lib/drive";

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

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
    /downloadUrl[^"']*confirm=([0-9A-Za-z_-]+)/,
    /uc-download-link[^>]+href="[^"]*confirm=([0-9A-Za-z_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1] && match[1] !== "t") return match[1];
  }

  return null;
}

async function fetchDriveOnce(
  fileId: string,
  rangeHeader: string | null | undefined,
  confirm?: string,
  cookieHeader?: string
): Promise<Response> {
  const headers: HeadersInit = {
    "User-Agent": BROWSER_UA,
    Accept: "*/*",
  };
  if (rangeHeader) headers.Range = rangeHeader;
  if (cookieHeader) headers.Cookie = cookieHeader;

  return fetch(driveDownloadUrl(fileId, confirm), {
    headers,
    redirect: "follow",
  });
}

export async function fetchPublicDriveStream(
  fileIdOrUrl: string,
  rangeHeader?: string | null
): Promise<Response> {
  const fileId = extractGoogleDriveFileId(fileIdOrUrl) ?? fileIdOrUrl;

  let response = await fetchDriveOnce(fileId, rangeHeader, "t");
  let contentType = response.headers.get("content-type") ?? "";
  let setCookie = response.headers.get("set-cookie");

  if (contentType.includes("text/html")) {
    const html = await response.text();
    const confirm = extractConfirmToken(html) ?? "t";
    const cookieHeader = parseCookies(setCookie);
    response = await fetchDriveOnce(
      fileId,
      rangeHeader,
      confirm,
      cookieHeader || undefined
    );
    contentType = response.headers.get("content-type") ?? "";
  }

  if (!response.ok && response.status !== 206) {
    response = await fetchDriveOnce(fileId, rangeHeader);
    contentType = response.headers.get("content-type") ?? "";
    setCookie = response.headers.get("set-cookie");

    if (contentType.includes("text/html")) {
      const html = await response.text();
      const confirm = extractConfirmToken(html) ?? "t";
      const cookieHeader = parseCookies(setCookie);
      response = await fetchDriveOnce(
        fileId,
        rangeHeader,
        confirm,
        cookieHeader || undefined
      );
      contentType = response.headers.get("content-type") ?? "";
    }
  }

  if (!response.ok && response.status !== 206) {
    throw new Error(
      `Drive download failed (${response.status}). Check the file is shared as Anyone with the link → Viewer.`
    );
  }

  const finalType = response.headers.get("content-type") ?? "";
  if (finalType.includes("text/html")) {
    throw new Error(
      "Google Drive blocked direct media access for this file. Re-check sharing settings."
    );
  }

  return response;
}
