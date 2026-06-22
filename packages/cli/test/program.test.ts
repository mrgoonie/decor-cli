import { describe, expect, it } from "vitest";
import { createProgram } from "../src/program.js";

describe("CLI program", () => {
  it("registers expected commands", () => {
    const commands = createProgram().commands.map((command) => command.name()).sort();
    expect(commands).toEqual(["config", "doctor", "list-templates", "preview", "render", "validate"]);
  });
});
