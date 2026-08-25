import { ProductDocument, Segment } from "../db/product.entity";

export const SEARCH_MODES = ["keyword", "hybrid"] as const;
export type SearchMode = (typeof SEARCH_MODES)[number];

export interface FieldBoosts {
  name: number;
  description: number;
  brand: number;
}

export interface HybridConfig {
  keywordWeight: number;
  semanticWeight: number;
  k: number;
}

export interface SearchConfig {
  mode: SearchMode;
  fields: FieldBoosts;
  useSynonyms: boolean;
  hybrid: HybridConfig;
}

export interface SearchRequest {
  q: string;
  size: number;
  config: SearchConfig;
}

export type ClauseContribution = { score: number; rank: number } | null;

export type Explanation =
  | { mode: "keyword"; bm25: unknown }
  | {
      mode: "hybrid";
      keyword: ClauseContribution;
      semantic: ClauseContribution;
      fused: number;
    };

export interface SearchHit {
  id: string;
  score: number;
  source: ProductDocument;
  explanation: Explanation;
}

export interface SearchResponse {
  query: string;
  config: SearchConfig;
  took_ms: number;
  total: number;
  hits: SearchHit[];
}

export type ListingSort =
  "relevance" | "price_asc" | "price_desc" | "rating_desc";

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

export interface ListingResponse {
  total: number;
  page: number;
  size: number;
  items: ProductDocument[];
}

export class ValidationError extends Error {
  readonly status = 400;

  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}
