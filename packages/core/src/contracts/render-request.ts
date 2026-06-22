import { z } from "zod";
import { AnnotationSchema } from "./annotations.js";
import { BackgroundSchema } from "./background.js";
import { AlignmentSchema, RectSchema } from "./primitives.js";

export const InputSourceSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("path"), path: z.string().min(1) }),
  z.object({ type: z.literal("url"), url: z.string().url() }),
  z.object({ type: z.literal("base64"), data: z.string().min(1), mediaType: z.string().optional() })
]);

export const ShadowSchema = z.object({
  opacity: z.number().min(0).max(1).default(0.35),
  blur: z.number().min(0).max(120).default(36),
  offsetX: z.number().default(0),
  offsetY: z.number().default(18),
  color: z.string().default("#000000")
});

export const ContainerSchema = z.object({
  radius: z.number().min(0).default(36),
  padding: z.number().min(0).default(96),
  alignment: AlignmentSchema.default("center"),
  shadow: ShadowSchema.default({})
});

export const SpotlightSchema = z.object({
  region: RectSchema,
  opacity: z.number().min(0).max(1).default(0.62),
  radius: z.number().min(0).default(20)
});

export const OutputSchema = z.object({
  path: z.string().min(1),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  format: z.enum(["png", "jpeg", "webp", "avif", "tiff", "mp4", "webm"]).optional(),
  quality: z.number().min(1).max(100).default(92),
  overwrite: z.boolean().default(false)
});

export const RenderOptionsSchema = z.object({
  allowPrivateNetwork: z.boolean().default(false),
  maxInputBytes: z.number().int().positive().default(50 * 1024 * 1024),
  maxPixels: z.number().int().positive().default(40_000_000),
  maxVideoDurationSeconds: z.number().positive().default(60),
  requestTimeoutMs: z.number().int().positive().default(15000),
  maxRedirects: z.number().int().min(0).max(10).default(3),
  keepTemp: z.boolean().default(false)
});

export const RenderRequestSchema = z.object({
  input: InputSourceSchema,
  output: OutputSchema,
  template: z.string().optional(),
  background: BackgroundSchema.default({ type: "gradient" }),
  container: ContainerSchema.default({}),
  backgroundOverlayOpacity: z.number().min(0).max(1).default(0),
  crop: RectSchema.optional(),
  annotations: z.array(AnnotationSchema).default([]),
  spotlight: SpotlightSchema.optional(),
  options: RenderOptionsSchema.default({})
});

export type InputSource = z.infer<typeof InputSourceSchema>;
export type Container = z.infer<typeof ContainerSchema>;
export type Shadow = z.infer<typeof ShadowSchema>;
export type Spotlight = z.infer<typeof SpotlightSchema>;
export type OutputOptions = z.infer<typeof OutputSchema>;
export type RenderOptions = z.infer<typeof RenderOptionsSchema>;
export type RenderRequest = z.infer<typeof RenderRequestSchema>;
