import { Column, Entity, PrimaryColumn } from "typeorm";
import { NumericColumnTransformer } from "./numeric-column.transformer";

export type Segment = "women" | "men" | "kids";

export interface ProductDocument {
  id: string;
  name: string;
  description: string;
  brand: string;
  segment: Segment;
  category: string;
  category_path: string[];
  color: string;
  material: string | null;
  premium: boolean;
  price: number;
  original_price: number | null;
  discount_pct: number | null;
  in_stock: boolean;
  avg_rating: number | null;
  rating_count: number | null;
  sizes: string[];
  images: string[];
  embed_text: string;
}

const numeric = new NumericColumnTransformer();

@Entity("products")
export class Product {
  @PrimaryColumn("text")
  id!: string;

  @Column("text")
  name!: string;

  @Column("text")
  description!: string;

  @Column("text")
  brand!: string;

  @Column("text")
  segment!: Segment;

  @Column("text")
  category!: string;

  @Column("text", { array: true, name: "category_path" })
  categoryPath!: string[];

  @Column("text")
  color!: string;

  @Column("text", { nullable: true })
  material!: string | null;

  @Column("boolean")
  premium!: boolean;

  @Column("numeric", { precision: 10, scale: 2, transformer: numeric })
  price!: number;

  @Column("numeric", {
    precision: 10,
    scale: 2,
    nullable: true,
    name: "original_price",
    transformer: numeric,
  })
  originalPrice!: number | null;

  @Column("real", { nullable: true, name: "discount_pct" })
  discountPct!: number | null;

  @Column("boolean", { name: "in_stock" })
  inStock!: boolean;

  @Column("real", { nullable: true, name: "avg_rating" })
  avgRating!: number | null;

  @Column("int", { nullable: true, name: "rating_count" })
  ratingCount!: number | null;

  @Column("text", { array: true })
  sizes!: string[];

  @Column("text", { array: true })
  images!: string[];

  @Column("text", { name: "embed_text" })
  embedText!: string;

  toDocument(): ProductDocument {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      brand: this.brand,
      segment: this.segment,
      category: this.category,
      category_path: this.categoryPath,
      color: this.color,
      material: this.material,
      premium: this.premium,
      price: this.price,
      original_price: this.originalPrice,
      discount_pct: this.discountPct,
      in_stock: this.inStock,
      avg_rating: this.avgRating,
      rating_count: this.ratingCount,
      sizes: this.sizes,
      images: this.images,
      embed_text: this.embedText,
    };
  }
}
