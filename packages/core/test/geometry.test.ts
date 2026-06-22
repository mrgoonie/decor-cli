import { describe, expect, it } from "vitest";
import { alignedRect, containSize } from "../src/scene/geometry.js";

describe("geometry", () => {
  it("contains source without distortion", () => {
    expect(containSize({ width: 1600, height: 900 }, { width: 800, height: 800 })).toEqual({ width: 800, height: 450 });
  });

  it("supports nine-point alignment", () => {
    expect(alignedRect({ width: 100, height: 80 }, { width: 300, height: 260 }, 20, "bottom-right")).toEqual({
      x: 180,
      y: 160,
      width: 100,
      height: 80
    });
    expect(alignedRect({ width: 100, height: 80 }, { width: 300, height: 260 }, 20, "center")).toEqual({
      x: 100,
      y: 90,
      width: 100,
      height: 80
    });
  });
});
