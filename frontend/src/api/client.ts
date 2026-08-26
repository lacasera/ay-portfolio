import type {
  ListingResponse,
  ListingSort,
  SearchRequest,
  SearchResponse,
  Segment,
} from "@ay/shared";

export interface ListingParams {
  page: number;
  size: number;
  sort: ListingSort;
  category: string | null;
  segment: Segment | null;
  premium: boolean | null;
  inStock: boolean | null;
}

export class ApiClient {
  constructor(private readonly baseUrl = "/api") {}

  async search(
    request: SearchRequest,
    signal?: AbortSignal
  ): Promise<SearchResponse> {
    return this.request<SearchResponse>("/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request),
      signal,
    });
  }

  async listProducts(
    params: ListingParams,
    signal?: AbortSignal
  ): Promise<ListingResponse> {
    const query = new URLSearchParams({
      page: String(params.page),
      size: String(params.size),
      sort: params.sort,
    });
    if (params.category) query.set("category", params.category);
    if (params.segment) query.set("segment", params.segment);
    if (params.premium !== null) query.set("premium", String(params.premium));
    if (params.inStock !== null) query.set("in_stock", String(params.inStock));
    return this.request<ListingResponse>(`/products?${query.toString()}`, {
      signal,
    });
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, init);
    if (!response.ok) {
      const message = await this.readError(response);
      throw new Error(message);
    }
    return response.json() as Promise<T>;
  }

  private async readError(response: Response): Promise<string> {
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) return body.error;
    } catch {
      // fall through to the status text
    }
    return `Request failed (${response.status})`;
  }
}
