import { z } from "zod";
import { ColorSchema } from "./primitives.js";

export const GradientBackgroundSchema = z.object({
  type: z.literal("gradient"),
  from: ColorSchema.default("#8b5cf6"),
  to: ColorSchema.default("#111827"),
  angle: z.number().default(135)
});

export const ImageBackgroundSchema = z.object({
  type: z.literal("image"),
  path: z.string().optional(),
  folder: z.string().optional(),
  opacity: z.number().min(0).max(1).default(1),
  blur: z.number().min(0).max(80).default(0)
});

export const SolidBackgroundSchema = z.object({
  type: z.literal("solid"),
  color: ColorSchema.default("#111827")
});

export const BackgroundSchema = z.discriminatedUnion("type", [
  GradientBackgroundSchema,
  ImageBackgroundSchema,
  SolidBackgroundSchema
]);

export type Background = z.infer<typeof BackgroundSchema>;
