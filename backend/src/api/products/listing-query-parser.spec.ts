import { describe, expect, it } from "vitest";
import { ListingQueryParser } from "./listing-query-parser";
import { ValidationError } from "./search-types";

const parser = new ListingQueryParser();

describe("ListingQueryParser", () => {
  it("applies defaults for an empty query", () => {
    expect(parser.parse({})).toEqual({
      page: 1,
      size: 24,
      category: null,
      segment: null,
      brand: null,
      color: null,
      premium: null,
      inStock: null,
      minPrice: null,
      maxPrice: null,
      sort: "relevance",
    });
  });

  it("clamps size and floors page (query-string values are strings)", () => {
    expect(parser.parse({ size: "500" }).size).toBe(100);
    expect(parser.parse({ page: "0" }).page).toBe(1);
    expect(parser.parse({ page: "3" }).page).toBe(3);
  });

  it("parses the in_stock/premium booleans and price range", () => {
    const q = parser.parse({
      premium: "true",
      in_stock: "false",
      minPrice: "10",
      maxPrice: "50.5",
    });
    expect(q.premium).toBe(true);
    expect(q.inStock).toBe(false);
    expect(q.minPrice).toBe(10);
    expect(q.maxPrice).toBe(50.5);
    expect(parser.parse({ premium: "maybe" }).premium).toBeNull();
  });

  it("validates segment and sort", () => {
    expect(parser.parse({ segment: "women" }).segment).toBe("women");
    expect(parser.parse({ sort: "price_asc" }).sort).toBe("price_asc");
    expect(() => parser.parse({ segment: "unisex" })).toThrow(ValidationError);
    expect(() => parser.parse({ sort: "cheapest" })).toThrow(
      /must be one of relevance/
    );
    expect(() => parser.parse({ minPrice: "cheap" })).toThrow(
      /expected a number/
    );
  });
});
