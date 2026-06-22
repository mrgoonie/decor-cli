import type { Alignment, Rect } from "../contracts/primitives.js";

export interface Size {
  width: number;
  height: number;
}

export function containSize(source: Size, max: Size): Size {
  const scale = Math.min(max.width / source.width, max.height / source.height);
  return {
    width: Math.round(source.width * scale),
    height: Math.round(source.height * scale)
  };
}

export function alignedRect(size: Size, canvas: Size, padding: number, alignment: Alignment): Rect {
  const available = {
    x: padding,
    y: padding,
    width: Math.max(1, canvas.width - padding * 2),
    height: Math.max(1, canvas.height - padding * 2)
  };
  const xByAlignment: Record<Alignment, number> = {
    "top-left": available.x,
    "middle-left": available.x,
    "bottom-left": available.x,
    "top-center": available.x + (available.width - size.width) / 2,
    center: available.x + (available.width - size.width) / 2,
    "bottom-center": available.x + (available.width - size.width) / 2,
    "top-right": available.x + available.width - size.width,
    "middle-right": available.x + available.width - size.width,
    "bottom-right": available.x + available.width - size.width
  };
  const yByAlignment: Record<Alignment, number> = {
    "top-left": available.y,
    "top-center": available.y,
    "top-right": available.y,
    "middle-left": available.y + (available.height - size.height) / 2,
    center: available.y + (available.height - size.height) / 2,
    "middle-right": available.y + (available.height - size.height) / 2,
    "bottom-left": available.y + available.height - size.height,
    "bottom-center": available.y + available.height - size.height,
    "bottom-right": available.y + available.height - size.height
  };
  return {
    x: Math.round(xByAlignment[alignment]),
    y: Math.round(yByAlignment[alignment]),
    width: size.width,
    height: size.height
  };
}

export function defaultCanvasSize(input: Size, padding: number, requested?: Partial<Size>): Size {
  return {
    width: requested?.width ?? input.width + padding * 2,
    height: requested?.height ?? input.height + padding * 2
  };
}
