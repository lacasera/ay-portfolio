import { describe, expect, it } from "vitest";
import { Product } from "../product.entity";
import { SeedSummary } from "./seed-summary";

function makeProduct(overrides: Partial<Product> = {}): Product {
  const product = new Product();
  product.category = "Dresses";
  product.segment = "women";
  product.premium = false;
  return Object.assign(product, overrides);
}

describe("SeedSummary", () => {
  it("counts totals, categories, segments and premium share", () => {
    const summary = new SeedSummary();
    summary.record(makeProduct({ category: "Dresses", premium: true }));
    summary.record(makeProduct({ category: "Jeans", segment: "men" }));
    summary.record(makeProduct({ category: "Jeans", segment: "men" }));
    summary.record(makeProduct({ category: "Jeans", segment: "kids" }));

    expect(summary.count).toBe(4);
    const formatted = summary.format();
    expect(formatted).toContain("Categories: 2");
    expect(formatted).toContain("women 1");
    expect(formatted).toContain("men 2");
    expect(formatted).toContain("kids 1");
    expect(formatted).toContain("Premium: 1 (25%)");
  });

  it("reports 0% premium when empty", () => {
    expect(new SeedSummary().format()).toContain("Premium: 0 (0%)");
  });
});
