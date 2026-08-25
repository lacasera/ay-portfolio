import { OpenSearchClient } from "./opensearch-client";
import { EMBEDDING_MODEL } from "./search-config";

interface ModelSearchResponse {
  hits?: {
    hits?: { _id: string; _source?: { name?: string; model_state?: string } }[];
  };
}

export class ModelNotDeployedError extends Error {
  constructor() {
    super(
      "Embedding model is not deployed. Run `npm run search:setup` to provision it."
    );
    this.name = "ModelNotDeployedError";
  }
}

export class ModelRegistry {
  private cachedModelId: string | null = null;

  constructor(private readonly opensearch: OpenSearchClient) {}

  async resolveModelId(): Promise<string> {
    if (this.cachedModelId) {
      return this.cachedModelId;
    }
    const modelId = await this.findDeployedModelId();
    if (!modelId) {
      throw new ModelNotDeployedError();
    }
    this.cachedModelId = modelId;
    return modelId;
  }

  private async findDeployedModelId(): Promise<string | null> {
    const response = await this.opensearch.request<ModelSearchResponse>({
      method: "POST",
      path: "/_plugins/_ml/models/_search",
      body: {
        size: 10,
        query: {
          bool: {
            must: [
              { match_phrase: { name: EMBEDDING_MODEL.name } },
              { term: { model_state: "DEPLOYED" } },
            ],
          },
        },
      },
    });
    const hit = response.hits?.hits?.find(
      (h) => h._source?.name === EMBEDDING_MODEL.name
    );
    return hit?._id ?? null;
  }
}
