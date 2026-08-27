import type { ListingSort, SearchMode, Segment } from "@ay/shared";

export type * from "@ay/shared";

export const SEARCH_MODES = [
  "keyword",
  "hybrid",
] as const satisfies readonly SearchMode[];

export interface ListingQuery {
  page: number;
  size: number;
  category: string | null;
  segment: Segment | null;
  brand: string | null;
  color: string | null;
  premium: boolean | null;
  inStock: boolean | null;
  minPrice: number | null;
  maxPrice: number | null;
  sort: ListingSort;
}

export class ValidationError extends Error {
  readonly status = 400;

  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}
