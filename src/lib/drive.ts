export function extractGoogleDriveFileId(input: string): string | null {
  const trimmed = input.trim();

  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
    /\/open\?id=([a-zA-Z0-9_-]+)/,
    /\/uc\?id=([a-zA-Z0-9_-]+)/,
    /^([a-zA-Z0-9_-]{25,})$/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

export function isGoogleDriveUrl(input: string): boolean {
  const trimmed = input.trim().toLowerCase();
  return (
    trimmed.includes("drive.google.com") ||
    trimmed.includes("docs.google.com") ||
    Boolean(extractGoogleDriveFileId(input))
  );
}

export function drivePreviewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

export function driveViewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

export function driveDownloadUrl(fileId: string, confirm?: string): string {
  const base = `https://drive.google.com/uc?export=download&id=${fileId}`;
  return confirm ? `${base}&confirm=${confirm}` : base;
}
