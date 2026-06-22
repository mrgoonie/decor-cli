import type { RenderRequest } from "../contracts/render-request.js";

export interface TemplateDefinition {
  name: string;
  description: string;
  demoHint: string;
  defaults: Partial<RenderRequest>;
}

export const builtInTemplates: TemplateDefinition[] = [
  {
    name: "clean-gradient",
    description: "Large rounded screenshot over a purple-to-charcoal gradient.",
    demoHint: "Best for terminal screenshots and app captures.",
    defaults: {
      background: { type: "gradient", from: "#9f7aea", to: "#111827", angle: 135 },
      container: { padding: 96, radius: 36, alignment: "center", shadow: { opacity: 0.38, blur: 44, offsetX: 0, offsetY: 20, color: "#000000" } }
    }
  },
  {
    name: "editorial-light",
    description: "Warm paper background with compact shadow and softer radius.",
    demoHint: "Best for docs, reports, and product notes.",
    defaults: {
      background: { type: "solid", color: "#f4efe7" },
      container: { padding: 80, radius: 22, alignment: "center", shadow: { opacity: 0.2, blur: 26, offsetX: 0, offsetY: 14, color: "#3b332d" } }
    }
  },
  {
    name: "dark-focus",
    description: "Deep neutral background with stronger focus on the source image.",
    demoHint: "Best for UI bug reports and dark screenshots.",
    defaults: {
      background: { type: "gradient", from: "#0f172a", to: "#334155", angle: 30 },
      backgroundOverlayOpacity: 0.1,
      container: { padding: 72, radius: 28, alignment: "center", shadow: { opacity: 0.5, blur: 52, offsetX: 0, offsetY: 22, color: "#000000" } }
    }
  }
];

export function listTemplates(): TemplateDefinition[] {
  return builtInTemplates;
}

export function findTemplate(name: string): TemplateDefinition | undefined {
  return builtInTemplates.find((template) => template.name === name);
}
