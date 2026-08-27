import { describe, expect, it } from "vitest";
import type {
  FieldBoosts,
  HybridConfig,
  SearchMode,
  SearchRequest,
} from "../shared/search-types";
import { KEYWORD_MIN_SHOULD_MATCH, ProductQueryBuilder } from "./query-builder";

function makeRequest(overrides: {
  q?: string;
  size?: number;
  mode?: SearchMode;
  useSynonyms?: boolean;
  fields?: FieldBoosts;
  hybrid?: HybridConfig;
}): SearchRequest {
  return {
    q: overrides.q ?? "office bag",
    size: overrides.size ?? 20,
    config: {
      mode: overrides.mode ?? "hybrid",
      useSynonyms: overrides.useSynonyms ?? true,
      fields: overrides.fields ?? {
        name: 3,
        description: 1,
        brand: 2
      },
      hybrid: overrides.hybrid ?? {
        keywordWeight: 0.3,
        semanticWeight: 0.7,
        k: 50,
      },
    },
  };
}

interface MultiMatch {
  multi_match: {
    query: string;
    type: string;
    fields: string[];
    minimum_should_match?: string;
  };
}
interface Neural {
  neural: { embedding: { query_text: string; model_id: string; k: number } };
}

const builder = new ProductQueryBuilder();

describe("ProductQueryBuilder", () => {
  it("keywordBody queries name.syn with boosts and excludes embedding", () => {
    const body = builder.keywordBody(makeRequest({}), true);
    expect(body).toMatchObject({
      size: 20,
      explain: true,
      _source: { excludes: ["embedding"] },
    });
    const clause = body.query as MultiMatch;
    expect(clause.multi_match.query).toBe("office bag");
    expect(clause.multi_match.type).toBe("best_fields");
    expect(clause.multi_match.fields).toEqual([
      "name.syn^3",
      "description^1",
      "brand^2",
    ]);
  });

  it("keywordBody uses the plain name field when synonyms are off", () => {
    const body = builder.keywordBody(makeRequest({ useSynonyms: false }));
    const clause = body.query as MultiMatch;
    expect(clause.multi_match.fields[0]).toBe("name^3");
  });

  it("plain keywordBody has no minimum_should_match; passing one adds it", () => {
    const plain = builder.keywordBody(makeRequest({})).query as MultiMatch;
    expect(plain.multi_match.minimum_should_match).toBeUndefined();

    const strict = builder.keywordBody(makeRequest({}), false, 100, "2<-25%")
      .query as MultiMatch;
    expect(strict.multi_match.minimum_should_match).toBe("2<-25%");
  });

  it("hybridBody fuses a precision keyword clause (with MSM) and a neural clause", () => {
    const body = builder.hybridBody(makeRequest({}), "model-1");
    const queries = (body.query as { hybrid: { queries: unknown[] } }).hybrid
      .queries;
    expect(queries).toHaveLength(2);

    const keyword = queries[0] as MultiMatch;
    expect(keyword.multi_match.minimum_should_match).toBe(
      KEYWORD_MIN_SHOULD_MATCH
    );

    const neural = queries[1] as Neural;
    expect(neural.neural.embedding).toMatchObject({
      query_text: "office bag",
      model_id: "model-1",
      k: 50,
    });
  });

  it("clamps the fusion weights to (0,1) so OpenSearch always gets doubles", () => {
    const weightsFor = (keyword: number, semantic: number): number[] => {
      const pipeline = builder.inlinePipeline(
        makeRequest({
          hybrid: { keywordWeight: keyword, semanticWeight: semantic, k: 50 },
        })
      ) as {
        phase_results_processors: [
          {
            "normalization-processor": {
              combination: { parameters: { weights: number[] } };
            };
          },
        ];
      };
      return pipeline.phase_results_processors[0]["normalization-processor"]
        .combination.parameters.weights;
    };

    expect(weightsFor(0, 1)).toEqual([0.01, 0.99]);
    expect(weightsFor(1, 0)).toEqual([0.99, 0.01]);
    expect(weightsFor(0.3, 0.7)).toEqual([0.3, 0.7]);
  });
});
