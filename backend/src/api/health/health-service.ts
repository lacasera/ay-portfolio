import { ModelRegistry } from "../../search/model-registry";
import { OpenSearchClient } from "../../search/opensearch-client";
import { INDEX_NAME } from "../../search/search-config";

export interface HealthReport {
  status: "healthy" | "degraded";
  opensearch: string;
  index: boolean;
  model: boolean;
}

export class HealthService {
  constructor(
    private readonly opensearch = new OpenSearchClient(),
    private readonly models = new ModelRegistry(opensearch)
  ) {}

  async check(): Promise<HealthReport> {
    const opensearch = await this.clusterStatus();
    const index = await this.indexExists();
    const model = await this.modelDeployed();
    const healthy = opensearch !== "unreachable" && index && model;
    return {
      status: healthy ? "healthy" : "degraded",
      opensearch,
      index,
      model,
    };
  }

  private async clusterStatus(): Promise<string> {
    try {
      const response = await this.opensearch.client.cluster.health();
      return (response.body as { status?: string }).status ?? "unknown";
    } catch {
      return "unreachable";
    }
  }

  private async indexExists(): Promise<boolean> {
    try {
      const response = await this.opensearch.client.indices.exists({
        index: INDEX_NAME,
      });
      return response.body === true;
    } catch {
      return false;
    }
  }

  private async modelDeployed(): Promise<boolean> {
    try {
      await this.models.resolveModelId();
      return true;
    } catch {
      return false;
    }
  }
}
