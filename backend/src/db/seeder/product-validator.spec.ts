import { describe, expect, it } from "vitest";
import { Product } from "../product.entity";
import { ProductValidator } from "./product-validator";

function makeProduct(overrides: Partial<Product> = {}): Product {
  const product = new Product();
  product.id = "ay-000001";
  product.name = "Laptop Bag 'ETHON'";
  product.description = "A padded commuter bag.";
  product.brand = "BOSS";
  product.segment = "men";
  product.category = "Business & laptop bags";
  product.categoryPath = ["Accessories", "Bags & backpacks", "Bags"];
  product.color = "black";
  product.material = "Leather";
  product.premium = true;
  product.price = 189.9;
  product.originalPrice = null;
  product.discountPct = null;
  product.inStock = true;
  product.avgRating = 4.6;
  product.ratingCount = 128;
  product.sizes = ["One size"];
  product.images = ["https://example/1.jpg"];
  product.embedText = "Laptop Bag BOSS Business & laptop bags";
  return Object.assign(product, overrides);
}

const validator = new ProductValidator();

describe("ProductValidator", () => {
  it("accepts a well-formed product", () => {
    expect(() => validator.validate([makeProduct()])).not.toThrow();
  });

  it.each([
    [{ id: "" }, /<no id>: missing id/],
    [{ name: "" }, /ay-000001: empty name/],
    [{ brand: "" }, /empty brand/],
    [{ category: "" }, /empty category/],
    [{ categoryPath: [] }, /empty category_path/],
    [{ segment: "unisex" as Product["segment"] }, /invalid segment 'unisex'/],
    [{ price: 0 }, /price not positive \(0\)/],
    [{ embedText: "" }, /empty embed_text/],
  ])("rejects %o", (override, message) => {
    expect(() => validator.validate([makeProduct(override)])).toThrow(message);
  });

  it("throws on the first invalid product in a batch", () => {
    const batch = [makeProduct(), makeProduct({ id: "ay-9", price: -1 })];
    expect(() => validator.validate(batch)).toThrow(/ay-9: price not positive/);
  });
});
