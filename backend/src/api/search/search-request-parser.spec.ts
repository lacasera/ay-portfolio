import { describe, expect, it } from "vitest";
import { SearchRequestParser } from "./search-request-parser";
import { ValidationError } from "./search-types";

const parser = new SearchRequestParser();

describe("SearchRequestParser", () => {
  it("fills defaults when only q is given", () => {
    const req = parser.parse({ q: "office bag" });
    expect(req).toEqual({
      q: "office bag",
      size: 20,
      config: {
        mode: "hybrid",
        fields: { name: 3, description: 1, brand: 2 },
        useSynonyms: true,
        hybrid: { keywordWeight: 0.3, semanticWeight: 0.7, k: 50 },
      },
    });
  });

  it("trims q and rejects an empty/missing one", () => {
    expect(parser.parse({ q: "  bag " }).q).toBe("bag");
    expect(() => parser.parse({ q: "   " })).toThrow(ValidationError);
    expect(() => parser.parse({})).toThrow(/q is required/);
  });

  it("clamps size, k, and field boosts", () => {
    expect(parser.parse({ q: "x", size: 999 }).size).toBe(50);
    expect(parser.parse({ q: "x", size: 0 }).size).toBe(1);
    const cfg = parser.parse({
      q: "x",
      config: { fields: { name: 500, description: -5 }, hybrid: { k: 9999 } },
    }).config;
    expect(cfg.fields.name).toBe(100);
    expect(cfg.fields.description).toBe(0);
    expect(cfg.hybrid.k).toBe(200);
  });

  it("normalizes hybrid weights to sum to 1", () => {
    const cfg = parser.parse({
      q: "x",
      config: { hybrid: { keywordWeight: 0.6, semanticWeight: 0.6 } },
    }).config;
    expect(cfg.hybrid).toMatchObject({
      keywordWeight: 0.5,
      semanticWeight: 0.5,
    });
  });

  it("falls back to default weights when both are zero", () => {
    const cfg = parser.parse({
      q: "x",
      config: { hybrid: { keywordWeight: 0, semanticWeight: 0 } },
    }).config;
    expect(cfg.hybrid).toMatchObject({
      keywordWeight: 0.3,
      semanticWeight: 0.7,
    });
  });

  it("validates mode and rejects malformed input", () => {
    expect(
      parser.parse({ q: "x", config: { mode: "keyword" } }).config.mode
    ).toBe("keyword");
    expect(() => parser.parse({ q: "x", config: { mode: "fuzzy" } })).toThrow(
      /must be one of keyword, hybrid/
    );
    expect(() => parser.parse("not an object")).toThrow(ValidationError);
    expect(() =>
      parser.parse({ q: "x", config: { fields: { name: "high" } } })
    ).toThrow(/expected a number/);
  });
});
