import { OpenSearchClient } from "./opensearch-client";
import {
  INDEX_BODY,
  INDEX_NAME,
  INGEST_PIPELINE,
  SEARCH_PIPELINE,
  SEARCH_PIPELINE_BODY,
  ingestPipelineBody,
} from "./search-config";

export class ProductIndexProvisioner {
  constructor(private readonly opensearch: OpenSearchClient) {}

  async ensureIngestPipeline(modelId: string): Promise<void> {
    await this.opensearch.request({
      method: "PUT",
      path: `/_ingest/pipeline/${INGEST_PIPELINE}`,
      body: ingestPipelineBody(modelId),
    });
  }

  async ensureSearchPipeline(): Promise<void> {
    await this.opensearch.request({
      method: "PUT",
      path: `/_search/pipeline/${SEARCH_PIPELINE}`,
      body: SEARCH_PIPELINE_BODY,
    });
  }

  async ensureIndex(): Promise<void> {
    if (await this.indexExists()) return;
    await this.opensearch.request({
      method: "PUT",
      path: `/${INDEX_NAME}`,
      body: INDEX_BODY,
    });
  }

  private async indexExists(): Promise<boolean> {
    const response = await this.opensearch.client.indices.exists({
      index: INDEX_NAME,
    });
    return response.body === true;
  }
}
