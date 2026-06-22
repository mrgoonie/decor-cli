import type { Annotation } from "../contracts/annotations.js";
import type { Rect } from "../contracts/primitives.js";
import type { Spotlight } from "../contracts/render-request.js";
import { escapeXml, wrapText } from "./svg-utils.js";

function renderText(annotation: Extract<Annotation, { type: "text" }>): string {
  const maxChars = annotation.width ? Math.max(4, Math.floor(annotation.width / (annotation.fontSize * 0.55))) : 80;
  const lines = wrapText(annotation.text, maxChars);
  const lineHeight = annotation.fontSize * 1.2;
  const boxWidth = annotation.width ?? Math.max(...lines.map((line) => line.length)) * annotation.fontSize * 0.55;
  const boxHeight = lines.length * lineHeight + annotation.fontSize * 0.45;
  const background = annotation.backgroundColor
    ? `<rect x="${annotation.x - 12}" y="${annotation.y - annotation.fontSize}" width="${boxWidth + 24}" height="${boxHeight}" rx="${annotation.backgroundRadius}" fill="${annotation.backgroundColor}" opacity="${annotation.backgroundOpacity}" />`
    : "";
  const shadow = annotation.shadow ? 'filter="url(#textShadow)"' : "";
  const stroke = annotation.outlineColor && annotation.outlineWidth > 0
    ? `stroke="${annotation.outlineColor}" stroke-width="${annotation.outlineWidth}" paint-order="stroke"`
    : "";
  const tspans = lines.map((line, index) => `<tspan x="${annotation.x}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`).join("");
  return `${background}<text ${shadow} x="${annotation.x}" y="${annotation.y}" font-family="${escapeXml(annotation.fontFamily)}" font-size="${annotation.fontSize}" fill="${annotation.color}" ${stroke}>${tspans}</text>`;
}

function renderShape(annotation: Extract<Annotation, { type: "rect" | "circle" | "line" }>): string {
  const common = `stroke="${annotation.stroke}" stroke-width="${annotation.strokeWidth}" opacity="${annotation.opacity}" fill="${annotation.fill ?? "transparent"}" fill-opacity="${annotation.fillOpacity}"`;
  if (annotation.type === "circle") {
    return `<circle cx="${annotation.x}" cy="${annotation.y}" r="${annotation.radius ?? annotation.width ?? 24}" ${common} />`;
  }
  if (annotation.type === "line") {
    return `<line x1="${annotation.x}" y1="${annotation.y}" x2="${annotation.x2 ?? annotation.x}" y2="${annotation.y2 ?? annotation.y}" ${common} stroke-linecap="round" />`;
  }
  return `<rect x="${annotation.x}" y="${annotation.y}" width="${annotation.width ?? 100}" height="${annotation.height ?? 80}" rx="${annotation.cornerRadius}" ${common} />`;
}

function renderArrow(annotation: Extract<Annotation, { type: "arrow" }>, index: number): string {
  const dx = annotation.to.x - annotation.from.x;
  const dy = annotation.to.y - annotation.from.y;
  const controlX = annotation.from.x + dx / 2 - dy * annotation.curve;
  const controlY = annotation.from.y + dy / 2 + dx * annotation.curve;
  return `<path d="M ${annotation.from.x} ${annotation.from.y} Q ${controlX} ${controlY} ${annotation.to.x} ${annotation.to.y}" fill="none" stroke="${annotation.color}" stroke-width="${annotation.width}" stroke-linecap="round" marker-end="url(#arrowHead${index})" opacity="${annotation.opacity}" />`;
}

function renderCounter(annotation: Extract<Annotation, { type: "counter" }>): string {
  const radius = annotation.size / 2;
  const stroke = annotation.stroke ? `stroke="${annotation.stroke}" stroke-width="2"` : "";
  return `<g><circle cx="${annotation.x}" cy="${annotation.y}" r="${radius}" fill="${annotation.fill}" ${stroke}/><text x="${annotation.x}" y="${annotation.y}" text-anchor="middle" dominant-baseline="central" font-family="Arial, Helvetica, sans-serif" font-size="${annotation.size * 0.48}" font-weight="700" fill="${annotation.textColor}">${escapeXml(String(annotation.value))}</text></g>`;
}

function renderSpotlight(spotlight: Spotlight | undefined, container: Rect): string {
  if (!spotlight) return "";
  const x = container.x + spotlight.region.x;
  const y = container.y + spotlight.region.y;
  return `<path fill="rgba(0,0,0,${spotlight.opacity})" fill-rule="evenodd" d="M ${container.x} ${container.y} H ${container.x + container.width} V ${container.y + container.height} H ${container.x} Z M ${x} ${y} h ${spotlight.region.width} v ${spotlight.region.height} h -${spotlight.region.width} Z" />`;
}

export function buildOverlaySvg(width: number, height: number, annotations: Annotation[], container: Rect, spotlight?: Spotlight): Buffer {
  const markers = annotations
    .map((annotation, index) => annotation.type === "arrow" ? `<marker id="arrowHead${index}" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M 0 1 L 8 4 L 0 7 z" fill="${annotation.color}" /></marker>` : "")
    .join("");
  const body = annotations.map((annotation, index) => {
    if (annotation.type === "text") return renderText(annotation);
    if (annotation.type === "arrow") return renderArrow(annotation, index);
    if (annotation.type === "counter") return renderCounter(annotation);
    return renderShape(annotation);
  }).join("");
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><filter id="textShadow"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.45"/></filter>${markers}</defs>${renderSpotlight(spotlight, container)}${body}</svg>`);
}
