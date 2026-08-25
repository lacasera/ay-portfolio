import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse";
import { Product, Segment } from "../product.entity";

type RawRow = Record<string, string>;

export class CatalogCsvReader {
  private readonly csvPath: string;

  constructor(
    csvPath = process.env.CATALOG_CSV_PATH ??
      path.resolve(process.cwd(), "data", "catalog.csv")
  ) {
    this.csvPath = csvPath;
  }

  async *read(): AsyncGenerator<Product> {
    if (!fs.existsSync(this.csvPath)) {
      throw new Error(`Catalog CSV not found at ${this.csvPath}`);
    }
    const rows = fs
      .createReadStream(this.csvPath)
      .pipe(parse({ columns: true, skip_empty_lines: true }));
    for await (const row of rows) {
      yield this.toProduct(row as RawRow);
    }
  }

  private toProduct(row: RawRow): Product {
    const product = new Product();
    product.id = row.id!;
    product.name = row.name!;
    product.description = row.description!;
    product.brand = row.brand!;
    product.segment = row.segment as Segment;
    product.category = row.category!;
    product.categoryPath = this.splitList(row.category_path!);
    product.color = row.color!;
    product.material = this.textOrNull(row.material);
    product.premium = row.premium === "true";
    product.price = Number(row.price);
    product.originalPrice = this.numberOrNull(row.original_price);
    product.discountPct = this.numberOrNull(row.discount_pct);
    product.inStock = row.in_stock === "true";
    product.avgRating = this.numberOrNull(row.avg_rating);
    product.ratingCount = this.numberOrNull(row.rating_count);
    product.sizes = this.splitList(row.sizes!);
    product.images = this.splitList(row.images!);
    product.embedText = row.embed_text!;
    return product;
  }

  private splitList(value: string): string[] {
    return value ? value.split("|") : [];
  }

  private textOrNull(value: string | undefined): string | null {
    return value ? value : null;
  }

  private numberOrNull(value: string | undefined): number | null {
    return value ? Number(value) : null;
  }
}
