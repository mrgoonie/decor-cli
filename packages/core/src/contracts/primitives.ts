import { z } from "zod";

export const AlignmentSchema = z.enum([
  "top-left",
  "top-center",
  "top-right",
  "middle-left",
  "center",
  "middle-right",
  "bottom-left",
  "bottom-center",
  "bottom-right"
]);

export const ColorSchema = z.string().min(1);

export const RectSchema = z.object({
  x: z.number().min(0),
  y: z.number().min(0),
  width: z.number().positive(),
  height: z.number().positive()
});

export const PointSchema = z.object({
  x: z.number(),
  y: z.number()
});

export type Alignment = z.infer<typeof AlignmentSchema>;
export type Rect = z.infer<typeof RectSchema>;
export type Point = z.infer<typeof PointSchema>;
