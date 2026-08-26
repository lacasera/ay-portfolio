import { describe, expect, it } from "vitest";
import { NumericColumnTransformer } from "./numeric-column.transformer";

const transformer = new NumericColumnTransformer();

describe("NumericColumnTransformer", () => {
  it("parses numeric strings from the DB into numbers", () => {
    expect(transformer.from("12.50")).toBe(12.5);
    expect(transformer.from("0")).toBe(0);
  });

  it("passes null through in both directions", () => {
    expect(transformer.from(null)).toBeNull();
    expect(transformer.to(null)).toBeNull();
  });

  it("writes numbers back unchanged", () => {
    expect(transformer.to(19.9)).toBe(19.9);
  });
});
