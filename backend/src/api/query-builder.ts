import { SearchRequest } from "./search-types";

const SOURCE_EXCLUDES = ["embedding"];

type QueryClause = Record<string, unknown>;
type SearchBody = Record<string, unknown>;

export class ProductQueryBuilder {
  keywordBody(
    request: SearchRequest,
    explain = false,
    size = request.size
  ): SearchBody {
    return {
      size,
      _source: { excludes: SOURCE_EXCLUDES },
      explain,
      query: this.keywordClause(request),
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
            this.keywordClause(request),
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

  private keywordClause(request: SearchRequest): QueryClause {
    const nameField = request.config.useSynonyms ? "name.syn" : "name";
    const { name, description, brand } = request.config.fields;
    return {
      multi_match: {
        query: request.q,
        type: "best_fields",
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
