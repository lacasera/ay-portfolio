import { ProductDocument } from "../db/product.entity";
import { OpenSearchClient } from "../search/opensearch-client";
import { INDEX_NAME } from "../search/search-config";
import { ListingQuery, ListingResponse, ListingSort } from "./search-types";

interface OsResponse {
  hits: {
    total: { value: number };
    hits: { _source: ProductDocument }[];
  };
}

export class ProductListingService {
  constructor(private readonly opensearch = new OpenSearchClient()) {}

  async list(query: ListingQuery): Promise<ListingResponse> {
    const response = await this.opensearch.client.search({
      index: INDEX_NAME,
      body: {
        from: (query.page - 1) * query.size,
        size: query.size,
        _source: { excludes: ["embedding"] },
        query: { bool: { filter: this.filters(query) } },
        sort: this.sort(query.sort),
      },
    });
    const body = response.body as unknown as OsResponse;
    return {
      total: body.hits.total.value,
      page: query.page,
      size: query.size,
      items: body.hits.hits.map((hit) => hit._source),
    };
  }

  private filters(query: ListingQuery): Record<string, unknown>[] {
    const filters: Record<string, unknown>[] = [];

    const term = (field: string, value: unknown): void => {
      if (value !== null) {
        filters.push({ term: { [field]: value } });
      }
    };

    term("category", query.category);
    term("segment", query.segment);
    term("brand.kw", query.brand);
    term("color", query.color);
    term("premium", query.premium);
    term("in_stock", query.inStock);

    if (query.minPrice !== null || query.maxPrice !== null) {
      const range: Record<string, number> = {};

      if (query.minPrice !== null) {
        range.gte = query.minPrice;
      }

      if (query.maxPrice !== null) {
        range.lte = query.maxPrice;
      }

      filters.push({ range: { price: range } });
    }

    return filters;
  }

  private sort(sort: ListingSort): Record<string, unknown>[] {
    switch (sort) {
      case "price_asc":
        return [{ price: "asc" }];
      case "price_desc":
        return [{ price: "desc" }];
      case "rating_desc":
        return [{ avg_rating: { order: "desc", missing: "_last" } }];
      default:
        return [{ id: "asc" }];
    }
  }
}
