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

export type SearchMode = "keyword" | "hybrid";

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

export interface ListingResponse {
  total: number;
  page: number;
  size: number;
  items: ProductDocument[];
}
