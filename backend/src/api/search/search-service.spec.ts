import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ModelRegistry } from "../../search/model-registry";
import type { OpenSearchClient } from "../../search/opensearch-client";
import { SearchService } from "./search-service";
import { SearchConfig, SearchRequest } from "../shared/search-types";

// Fake OpenSearch/ModelRegistry so nothing touches a cluster. The real DI
// defaults would throw at construction without OPENSEARCH_NODE.
function osHit(id: string, score: number, explanation?: unknown) {
  return {
    _id: id,
    _score: score,
    _source: { id } as unknown,
    _explanation: explanation,
  };
}

function osResponse(total: number, hits: ReturnType<typeof osHit>[]) {
  return { body: { hits: { total: { value: total }, hits } } };
}

function makeRequest(mode: SearchConfig["mode"]): SearchRequest {
  return {
    q: "office bag",
    size: 20,
    config: {
      mode,
      fields: { name: 3, description: 1, brand: 2 },
      useSynonyms: true,
      hybrid: { keywordWeight: 0.3, semanticWeight: 0.7, k: 50 },
    },
  };
}

const search = vi.fn();
const resolveModelId = vi.fn();

function makeService(): SearchService {
  const opensearch = { client: { search } } as unknown as OpenSearchClient;
  const models = { resolveModelId } as unknown as ModelRegistry;
  return new SearchService(opensearch, models);
}

beforeEach(() => {
  search.mockReset();
  resolveModelId.mockReset();
});

describe("SearchService keyword mode", () => {
  it("runs a single query and surfaces the bm25 explanation", async () => {
    search.mockResolvedValueOnce(
      osResponse(1, [osHit("ay-1", 12.3, { description: "bm25" })])
    );

    const response = await makeService().search(makeRequest("keyword"));

    expect(search).toHaveBeenCalledTimes(1);
    expect(resolveModelId).not.toHaveBeenCalled();
    expect(response.total).toBe(1);
    expect(typeof response.took_ms).toBe("number");
    expect(response.hits[0].explanation).toEqual({
      mode: "keyword",
      bm25: { description: "bm25" },
    });
  });

  it("defaults bm25 to null when the hit carries no explanation", async () => {
    search.mockResolvedValueOnce(osResponse(1, [osHit("ay-1", 5)]));

    const response = await makeService().search(makeRequest("keyword"));

    expect(response.hits[0].explanation).toEqual({
      mode: "keyword",
      bm25: null,
    });
  });
});

describe("SearchService hybrid mode", () => {
  it("fuses three rankings, assigning ranks and null for absent clauses", async () => {
    resolveModelId.mockResolvedValue("model-1");
    // Order matters: fused, keyword-ranking, semantic-ranking.
    search
      .mockResolvedValueOnce(
        osResponse(2, [osHit("ay-1", 0.9), osHit("ay-2", 0.4)])
      )
      .mockResolvedValueOnce(
        osResponse(2, [osHit("ay-1", 15), osHit("ay-3", 9)])
      )
      .mockResolvedValueOnce(osResponse(1, [osHit("ay-2", 0.88)]));

    const response = await makeService().search(makeRequest("hybrid"));

    expect(resolveModelId).toHaveBeenCalledTimes(1);
    expect(search).toHaveBeenCalledTimes(3);
    expect(response.total).toBe(2);

    expect(response.hits[0].explanation).toEqual({
      mode: "hybrid",
      keyword: { score: 15, rank: 1 },
      semantic: null,
      fused: 0.9,
    });
    expect(response.hits[1].explanation).toEqual({
      mode: "hybrid",
      keyword: null,
      semantic: { score: 0.88, rank: 1 },
      fused: 0.4,
    });
  });
});
