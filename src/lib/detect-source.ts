import type { SourceType } from "@/types/database";
import { extractGoogleDriveFileId, isGoogleDriveUrl } from "@/lib/drive";

export { extractGoogleDriveFileId, isGoogleDriveUrl } from "@/lib/drive";

export function detectSourceType(url: string): SourceType | null {
  if (isGoogleDriveUrl(url)) return "google_drive";
  return null;
}

export function normalizeSourceRef(
  input: string,
  sourceType: SourceType
): string {
  if (sourceType === "google_drive" || sourceType === "google_meet") {
    return extractGoogleDriveFileId(input) ?? input.trim();
  }
  return input.trim();
}
