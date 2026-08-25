import { Segment } from "../db/product.entity";
import { ListingQuery, ListingSort, ValidationError } from "./search-types";

const MAX_SIZE = 100;
const SEGMENTS: Segment[] = ["women", "men", "kids"];
const SORTS: ListingSort[] = [
  "relevance",
  "price_asc",
  "price_desc",
  "rating_desc",
];

type Raw = Record<string, unknown>;

export class ListingQueryParser {
  parse(query: unknown): ListingQuery {
    const raw = (query ?? {}) as Raw;
    return {
      page: this.int(raw.page, 1, 1, Number.MAX_SAFE_INTEGER),
      size: this.int(raw.size, 24, 1, MAX_SIZE),
      category: this.str(raw.category),
      segment: this.segment(raw.segment),
      brand: this.str(raw.brand),
      color: this.str(raw.color),
      premium: this.bool(raw.premium),
      inStock: this.bool(raw.in_stock),
      minPrice: this.num(raw.minPrice),
      maxPrice: this.num(raw.maxPrice),
      sort: this.sort(raw.sort),
    };
  }

  private str(value: unknown): string | null {
    return typeof value === "string" && value.trim() ? value.trim() : null;
  }

  private segment(value: unknown): Segment | null {
    const text = this.str(value);
    if (text === null) return null;
    if (!SEGMENTS.includes(text as Segment)) {
      throw new ValidationError(
        `segment must be one of ${SEGMENTS.join(", ")}`
      );
    }
    return text as Segment;
  }

  private sort(value: unknown): ListingSort {
    const text = this.str(value);
    if (text === null) return "relevance";
    if (!SORTS.includes(text as ListingSort)) {
      throw new ValidationError(`sort must be one of ${SORTS.join(", ")}`);
    }
    return text as ListingSort;
  }

  private bool(value: unknown): boolean | null {
    if (value === "true") {
      return true;
    }
    if (value === "false") {
      return false;
    }

    return null;
  }

  private num(value: unknown): number | null {
    if (typeof value !== "string" || value.trim() === "") return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      throw new ValidationError(`expected a number, got '${value}'`);
    }
    return parsed;
  }

  private int(
    value: unknown,
    fallback: number,
    min: number,
    max: number
  ): number {
    const parsed = this.num(value);
    if (parsed === null) {
      return fallback;
    }
    return Math.min(max, Math.max(min, Math.round(parsed)));
  }
}
