import { SearchRequest } from "./search-types";

const SOURCE_EXCLUDES = ["embedding"];

export const KEYWORD_MIN_SHOULD_MATCH = "2<-25%";

type QueryClause = Record<string, unknown>;
type SearchBody = Record<string, unknown>;

export class ProductQueryBuilder {
  keywordBody(
    request: SearchRequest,
    explain = false,
    size = request.size,
    minimumShouldMatch?: string
  ): SearchBody {
    return {
      size,
      _source: { excludes: SOURCE_EXCLUDES },
      explain,
      query: this.keywordClause(request, minimumShouldMatch),
    };
  }

  neuralBody(
    request: SearchRequest,
    modelId: string,
    size = request.size,
    k = request.config.hybrid.k
  ): SearchBody {
    return {
      size,
      _source: { excludes: SOURCE_EXCLUDES },
      query: this.neuralClause(request, modelId, k),
    };
  }

  hybridBody(request: SearchRequest, modelId: string): SearchBody {
    return {
      size: request.size,
      _source: { excludes: SOURCE_EXCLUDES },
      query: {
        hybrid: {
          queries: [
            this.keywordClause(request, KEYWORD_MIN_SHOULD_MATCH),
            this.neuralClause(request, modelId, request.config.hybrid.k),
          ],
        },
      },
    };
  }

  inlinePipeline(request: SearchRequest): Record<string, unknown> {
    return {
      phase_results_processors: [
        {
          "normalization-processor": {
            normalization: { technique: "min_max" },
            combination: {
              technique: "arithmetic_mean",
              parameters: {
                weights: [
                  request.config.hybrid.keywordWeight,
                  request.config.hybrid.semanticWeight,
                ],
              },
            },
          },
        },
      ],
    };
  }

  private keywordClause(
    request: SearchRequest,
    minimumShouldMatch?: string
  ): QueryClause {
    const nameField = request.config.useSynonyms ? "name.syn" : "name";
    const { name, description, brand } = request.config.fields;
    return {
      multi_match: {
        query: request.q,
        type: "best_fields",
        ...(minimumShouldMatch
          ? { minimum_should_match: minimumShouldMatch }
          : {}),
        fields: [
          `${nameField}^${name}`,
          `description^${description}`,
          `brand^${brand}`,
        ],
      },
    };
  }

  private neuralClause(
    request: SearchRequest,
    modelId: string,
    k: number
  ): QueryClause {
    return {
      neural: {
        embedding: {
          query_text: request.q,
          model_id: modelId,
          k,
        },
      },
    };
  }
}
