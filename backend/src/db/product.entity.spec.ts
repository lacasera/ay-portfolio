import { describe, expect, it } from "vitest";
import { Product } from "./product.entity";

describe("Product.toDocument", () => {
  it("maps camelCase entity fields onto the snake_case document", () => {
    const product = new Product();
    Object.assign(product, {
      id: "ay-000001",
      name: "Laptop Bag",
      description: "A padded commuter bag.",
      brand: "BOSS",
      segment: "men",
      category: "Business & laptop bags",
      categoryPath: ["Accessories", "Bags"],
      color: "black",
      material: null,
      premium: true,
      price: 189.9,
      originalPrice: 249.9,
      discountPct: 24,
      inStock: false,
      avgRating: 4.6,
      ratingCount: 128,
      sizes: ["One size"],
      images: ["https://example/1.jpg"],
      embedText: "Laptop Bag BOSS",
    });

    expect(product.toDocument()).toEqual({
      id: "ay-000001",
      name: "Laptop Bag",
      description: "A padded commuter bag.",
      brand: "BOSS",
      segment: "men",
      category: "Business & laptop bags",
      category_path: ["Accessories", "Bags"],
      color: "black",
      material: null,
      premium: true,
      price: 189.9,
      original_price: 249.9,
      discount_pct: 24,
      in_stock: false,
      avg_rating: 4.6,
      rating_count: 128,
      sizes: ["One size"],
      images: ["https://example/1.jpg"],
      embed_text: "Laptop Bag BOSS",
    });
  });
});
