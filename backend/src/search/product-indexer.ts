import { Database } from "../db/database";
import { Product, ProductDocument } from "../db/product.entity";

const BULK_BATCH_SIZE = 250;

export class ProductIndexer {
  constructor(private readonly database = new Database()) {}

  async run(): Promise<void> {
    await this.database.connect();
    try {
      const documents = await this.loadDocuments();
      for (const batch of this.batch(documents, BULK_BATCH_SIZE)) {
        await this.indexBatch(batch);
      }
    } finally {
      await this.database.disconnect();
    }
  }

  private async loadDocuments(): Promise<ProductDocument[]> {
    const products = await this.database.getRepository(Product).find();
    return products.map((product) => product.toDocument());
  }

  private *batch(
    documents: ProductDocument[],
    size: number
  ): Generator<ProductDocument[]> {
    for (let start = 0; start < documents.length; start += size) {
      yield documents.slice(start, start + size);
    }
  }

  private async indexBatch(batch: ProductDocument[]): Promise<void> {
    throw new Error(
      `OpenSearch is not provisioned yet: cannot index ${batch.length} documents. ` +
        `Add the opensearch service and run the §8 setup (model + products index + ingest pipeline) first.`
    );
  }
}
