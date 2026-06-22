import { z } from "zod";
import { ColorSchema, PointSchema } from "./primitives.js";

export const TextAnnotationSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number().positive().optional(),
  fontFamily: z.string().default("Arial, Helvetica, sans-serif"),
  fontSize: z.number().positive().default(40),
  color: ColorSchema.default("#ffffff"),
  outlineColor: ColorSchema.optional(),
  outlineWidth: z.number().min(0).default(0),
  shadow: z.boolean().default(false),
  backgroundColor: ColorSchema.optional(),
  backgroundOpacity: z.number().min(0).max(1).default(0.75),
  backgroundRadius: z.number().min(0).default(12)
});

export const ShapeAnnotationSchema = z.object({
  type: z.enum(["rect", "circle", "line"]),
  x: z.number(),
  y: z.number(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  radius: z.number().positive().optional(),
  x2: z.number().optional(),
  y2: z.number().optional(),
  stroke: ColorSchema.default("#ffffff"),
  strokeWidth: z.number().min(0).default(3),
  fill: ColorSchema.optional(),
  fillOpacity: z.number().min(0).max(1).default(0),
  opacity: z.number().min(0).max(1).default(1),
  cornerRadius: z.number().min(0).default(0)
});

export const ArrowAnnotationSchema = z.object({
  type: z.literal("arrow"),
  from: PointSchema,
  to: PointSchema,
  color: ColorSchema.default("#ffffff"),
  width: z.number().positive().default(5),
  curve: z.number().default(0.25),
  opacity: z.number().min(0).max(1).default(1)
});

export const CounterAnnotationSchema = z.object({
  type: z.literal("counter"),
  value: z.union([z.number(), z.string()]),
  x: z.number(),
  y: z.number(),
  size: z.number().positive().default(44),
  fill: ColorSchema.default("#ffffff"),
  textColor: ColorSchema.default("#111827"),
  stroke: ColorSchema.optional()
});

export const AnnotationSchema = z.discriminatedUnion("type", [
  TextAnnotationSchema,
  ShapeAnnotationSchema,
  ArrowAnnotationSchema,
  CounterAnnotationSchema
]);

export type TextAnnotation = z.infer<typeof TextAnnotationSchema>;
export type ShapeAnnotation = z.infer<typeof ShapeAnnotationSchema>;
export type ArrowAnnotation = z.infer<typeof ArrowAnnotationSchema>;
export type CounterAnnotation = z.infer<typeof CounterAnnotationSchema>;
export type Annotation = z.infer<typeof AnnotationSchema>;
