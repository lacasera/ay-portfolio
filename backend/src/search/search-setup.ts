import { EmbeddingModelProvisioner } from "./embedding-model-provisioner";
import { ProductIndexProvisioner } from "./index-provisioner";
import { OpenSearchClient } from "./opensearch-client";

export class SearchSetup {
  constructor(
    private readonly opensearch = new OpenSearchClient(),
    private readonly modelProvisioner = new EmbeddingModelProvisioner(
      opensearch
    ),
    private readonly indexProvisioner = new ProductIndexProvisioner(opensearch)
  ) { }

  async run(): Promise<void> {
    console.log("Provisioning embedding model (register + deploy)...");
    const modelId = await this.modelProvisioner.ensureDeployedModelId();
    console.log(`Model deployed: ${modelId}`);

    await this.indexProvisioner.ensureIngestPipeline(modelId);
    console.log("Ingest pipeline ready.");

    await this.indexProvisioner.ensureIndex();
    console.log("Products index ready.");

    await this.indexProvisioner.ensureSearchPipeline();
    console.log("Search pipeline ready.");
  }
}
