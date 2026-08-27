import { OpenSearchClient } from "./opensearch-client";
import {
  CLUSTER_SETTINGS,
  EMBEDDING_MODEL,
  MODEL_GROUP,
} from "./search-config";

interface RegisterResponse {
  task_id?: string;
  model_id?: string;
  model_group_id?: string;
}

interface ModelSearchResponse {
  hits?: {
    hits?: { _id: string; _source?: { name?: string; model_state?: string } }[];
  };
}

export class EmbeddingModelProvisioner {
  constructor(private readonly opensearch: OpenSearchClient) { }

  async ensureDeployedModelId(): Promise<string> {
    await this.applyClusterSettings();
    const existing = await this.findDeployedModelId();
    if (existing) {
      return existing;
    }

    const modelGroupId = await this.findOrCreateModelGroup();
    const modelId = await this.registerModel(modelGroupId);
    await this.deployModel(modelId);
    return modelId;
  }

  private async applyClusterSettings(): Promise<void> {
    await this.opensearch.request({
      method: "PUT",
      path: "/_cluster/settings",
      body: CLUSTER_SETTINGS,
    });
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
              {
                match_phrase: {
                  name: EMBEDDING_MODEL.name
                }
              },
              {
                term: {
                  model_state: "DEPLOYED"
                }
              },
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

  private async findOrCreateModelGroup(): Promise<string> {
    const existing = await this.opensearch.request<ModelSearchResponse>({
      method: "POST",
      path: "/_plugins/_ml/model_groups/_search",
      body: {
        size: 1,
        query: {
          match_phrase: {
            name: MODEL_GROUP
          }
        }
      },
    });

    const found = existing.hits?.hits?.[0]?._id;

    if (found) {
      return found;
    }

    const created = await this.opensearch.request<RegisterResponse>({
      method: "POST",
      path: "/_plugins/_ml/model_groups/_register",
      body: {
        name: MODEL_GROUP,
        description: "hybrid search models"
      },
    });

    if (!created.model_group_id) {
      throw new Error("Model group registration returned no model_group_id");
    }

    return created.model_group_id;
  }

  private async registerModel(modelGroupId: string): Promise<string> {
    const response = await this.opensearch.request<RegisterResponse>({
      method: "POST",
      path: "/_plugins/_ml/models/_register",
      body: {
        ...EMBEDDING_MODEL,
        model_group_id: modelGroupId
      },
    });

    if (!response.task_id) {
      throw new Error("Model registration returned no task_id");
    }
    const task = await this.opensearch.waitForTask(response.task_id);

    if (!task.model_id) {
      throw new Error("Model registration task returned no model_id");
    }

    return task.model_id;
  }

  private async deployModel(modelId: string): Promise<void> {
    const response = await this.opensearch.request<RegisterResponse>({
      method: "POST",
      path: `/_plugins/_ml/models/${modelId}/_deploy`,
    });

    if (!response.task_id) {
      throw new Error("Model deployment returned no task_id");
    }

    await this.opensearch.waitForTask(response.task_id);
  }
}
