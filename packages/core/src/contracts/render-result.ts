export type MediaKind = "image" | "video";

export interface MediaMetadata {
  kind: MediaKind;
  width: number;
  height: number;
  durationSeconds?: number;
  format?: string;
}

export interface RenderResult {
  ok: true;
  outputPath: string;
  media: MediaMetadata;
  warnings: string[];
}

export interface DoctorResult {
  ok: boolean;
  checks: Array<{
    name: string;
    ok: boolean;
    message: string;
    source?: string;
  }>;
}
