import { ProductDocument } from "../db/product.entity";
import { ModelRegistry } from "../search/model-registry";
import { OpenSearchClient } from "../search/opensearch-client";
import { INDEX_NAME } from "../search/search-config";
import { KEYWORD_MIN_SHOULD_MATCH, ProductQueryBuilder } from "./query-builder";
import { SearchHit, SearchRequest, SearchResponse } from "./search-types";

const FUSION_RANKING_SIZE = 100;

interface OsHit {
  _id: string;
  _score: number;
  _source: ProductDocument;
  _explanation?: unknown;
}

interface OsResponse {
  hits: { total: { value: number }; hits: OsHit[] };
}

type RankMap = Map<string, { score: number; rank: number }>;

export class SearchService {
  constructor(
    private readonly opensearch = new OpenSearchClient(),
    private readonly models = new ModelRegistry(opensearch),
    private readonly queries = new ProductQueryBuilder()
  ) {}

  async search(request: SearchRequest): Promise<SearchResponse> {
    const start = Date.now();
    const result =
      request.config.mode === "keyword"
        ? await this.keywordSearch(request)
        : await this.hybridSearch(request);
    return {
      query: request.q,
      config: request.config,
      took_ms: Date.now() - start,
      total: result.total,
      hits: result.hits,
    };
  }

  private async keywordSearch(
    request: SearchRequest
  ): Promise<{ total: number; hits: SearchHit[] }> {
    const response = await this.run(this.queries.keywordBody(request, true));
    const hits = response.hits.hits.map<SearchHit>((hit) => ({
      id: hit._id,
      score: hit._score,
      source: hit._source,
      explanation: { mode: "keyword", bm25: hit._explanation ?? null },
    }));
    return { total: response.hits.total.value, hits };
  }

  private async hybridSearch(
    request: SearchRequest
  ): Promise<{ total: number; hits: SearchHit[] }> {
    const modelId = await this.models.resolveModelId();
    const [fused, keywordRanking, semanticRanking] = await Promise.all([
      this.run(
        this.queries.hybridBody(request, modelId),
        this.queries.inlinePipeline(request)
      ),
      this.run(
        this.queries.keywordBody(
          request,
          false,
          FUSION_RANKING_SIZE,
          KEYWORD_MIN_SHOULD_MATCH
        )
      ),
      this.run(
        this.queries.neuralBody(
          request,
          modelId,
          FUSION_RANKING_SIZE,
          FUSION_RANKING_SIZE
        )
      ),
    ]);

    const keywordRank = this.rankMap(keywordRanking);
    const semanticRank = this.rankMap(semanticRanking);
    const hits = fused.hits.hits.map<SearchHit>((hit) => ({
      id: hit._id,
      score: hit._score,
      source: hit._source,
      explanation: {
        mode: "hybrid",
        keyword: keywordRank.get(hit._id) ?? null,
        semantic: semanticRank.get(hit._id) ?? null,
        fused: hit._score,
      },
    }));
    return { total: fused.hits.total.value, hits };
  }

  private rankMap(response: OsResponse): RankMap {
    const map: RankMap = new Map();
    response.hits.hits.forEach((hit, index) => {
      map.set(hit._id, { score: hit._score, rank: index + 1 });
    });
    return map;
  }

  private async run(
    body: Record<string, unknown>,
    searchPipeline?: Record<string, unknown>
  ): Promise<OsResponse> {
    const response = await this.opensearch.client.search({
      index: INDEX_NAME,
      body: searchPipeline
        ? { ...body, search_pipeline: searchPipeline }
        : body,
    });
    return response.body as unknown as OsResponse;
  }
}
