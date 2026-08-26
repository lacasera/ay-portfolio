import path from "node:path";
import { describe, expect, it } from "vitest";
import { Product } from "../product.entity";
import { CatalogCsvReader } from "./catalog-csv-reader";

const fixture = path.resolve(__dirname, "__fixtures__", "catalog.sample.csv");

async function collect(reader: CatalogCsvReader): Promise<Product[]> {
  const products: Product[] = [];
  for await (const product of reader.read()) {
    products.push(product);
  }
  return products;
}

describe("CatalogCsvReader", () => {
  it("decodes rows into Product entities", async () => {
    const products = await collect(new CatalogCsvReader(fixture));

    expect(products).toHaveLength(3);
    const [bag, dress, sneakers] = products;

    expect(bag.id).toBe("ay-000001");
    expect(bag.categoryPath).toEqual(["Accessories", "Bags"]);
    expect(bag.premium).toBe(true);
    expect(bag.price).toBe(189.9);
    expect(bag.originalPrice).toBe(249.9);
    expect(bag.discountPct).toBe(24);
    expect(bag.ratingCount).toBe(128);

    expect(dress.material).toBeNull();
    expect(dress.originalPrice).toBeNull();
    expect(dress.discountPct).toBeNull();
    expect(dress.avgRating).toBeNull();
    expect(dress.inStock).toBe(false);
    expect(dress.sizes).toEqual(["XS", "S", "M"]);
    expect(dress.images).toEqual([
      "https://example/2a.jpg",
      "https://example/2b.jpg",
    ]);

    expect(sneakers.segment).toBe("kids");
    expect(sneakers.premium).toBe(false);
  });

  it("throws when the CSV file is missing", async () => {
    const reader = new CatalogCsvReader(
      path.resolve(__dirname, "__fixtures__", "does-not-exist.csv")
    );
    await expect(collect(reader)).rejects.toThrow(/Catalog CSV not found at/);
  });
});
