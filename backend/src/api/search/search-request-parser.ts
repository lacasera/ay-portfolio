import {
  FieldBoosts,
  HybridConfig,
  SEARCH_MODES,
  SearchConfig,
  SearchRequest,
  ValidationError,
} from "../shared/search-types";

const MAX_SIZE = 50;
const MAX_K = 200;
const DEFAULT_BOOSTS: FieldBoosts = { name: 3, description: 1, brand: 2 };
const DEFAULT_WEIGHTS = { keyword: 0.3, semantic: 0.7 };

type Raw = Record<string, unknown>;

export class SearchRequestParser {
  parse(body: unknown): SearchRequest {
    const root = this.asObject(body, "request body");
    const q = this.asQuery(root.q);
    const size = this.clampInt(root.size, 20, 1, MAX_SIZE);
    const config = this.parseConfig(this.asObject(root.config ?? {}, "config"));
    return { q, size, config };
  }

  private parseConfig(raw: Raw): SearchConfig {
    return {
      mode: this.oneOf(raw.mode, SEARCH_MODES, "hybrid", "config.mode"),
      fields: this.parseBoosts(
        this.asObject(raw.fields ?? {}, "config.fields")
      ),
      useSynonyms: this.asBoolean(raw.useSynonyms, true),
      hybrid: this.parseHybrid(
        this.asObject(raw.hybrid ?? {}, "config.hybrid")
      ),
    };
  }

  private oneOf<T extends string>(
    value: unknown,
    allowed: readonly T[],
    fallback: T,
    label: string
  ): T {
    if (value === undefined) return fallback;
    if (typeof value !== "string" || !allowed.includes(value as T)) {
      throw new ValidationError(
        `${label} must be one of ${allowed.join(", ")}`
      );
    }
    return value as T;
  }

  private parseBoosts(raw: Raw): FieldBoosts {
    return {
      name: this.clampNumber(raw.name, DEFAULT_BOOSTS.name, 0, 100),
      description: this.clampNumber(
        raw.description,
        DEFAULT_BOOSTS.description,
        0,
        100
      ),
      brand: this.clampNumber(raw.brand, DEFAULT_BOOSTS.brand, 0, 100),
    };
  }

  private parseHybrid(raw: Raw): HybridConfig {
    const keyword = this.clampNumber(
      raw.keywordWeight,
      DEFAULT_WEIGHTS.keyword,
      0,
      1
    );
    const semantic = this.clampNumber(
      raw.semanticWeight,
      DEFAULT_WEIGHTS.semantic,
      0,
      1
    );
    const total = keyword + semantic;
    const normalized =
      total > 0
        ? { keyword: keyword / total, semantic: semantic / total }
        : DEFAULT_WEIGHTS;
    return {
      keywordWeight: round(normalized.keyword),
      semanticWeight: round(normalized.semantic),
      k: this.clampInt(raw.k, 50, 1, MAX_K),
    };
  }

  private asQuery(value: unknown): string {
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new ValidationError("q is required and must be a non-empty string");
    }
    return value.trim();
  }

  private asObject(value: unknown, label: string): Raw {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new ValidationError(`${label} must be an object`);
    }
    return value as Raw;
  }

  private asBoolean(value: unknown, fallback: boolean): boolean {
    return typeof value === "boolean" ? value : fallback;
  }

  private clampNumber(
    value: unknown,
    fallback: number,
    min: number,
    max: number
  ): number {
    if (value === undefined) return fallback;
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new ValidationError(
        `expected a number, got ${JSON.stringify(value)}`
      );
    }
    return Math.min(max, Math.max(min, value));
  }

  private clampInt(
    value: unknown,
    fallback: number,
    min: number,
    max: number
  ): number {
    return Math.round(this.clampNumber(value, fallback, min, max));
  }
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
