import { Database } from "../db/database";
import { Product, ProductDocument } from "../db/product.entity";
import { OpenSearchClient } from "./opensearch-client";
import { INDEX_NAME } from "./search-config";

const PAGE_SIZE = 200;

interface BulkResponse {
  errors: boolean;
  items: { index?: { error?: unknown } }[];
}

export class ProductIndexer {
  constructor(
    private readonly database = new Database(),
    private readonly opensearch = new OpenSearchClient()
  ) {}

  async run(): Promise<void> {
    await this.database.connect();
    try {
      let indexed = 0;
      for (let offset = 0; ; offset += PAGE_SIZE) {
        const products = await this.database.getRepository(Product).find({
          order: { id: "ASC" },
          skip: offset,
          take: PAGE_SIZE,
        });
        if (products.length === 0) break;
        await this.indexBatch(products.map((product) => product.toDocument()));
        indexed += products.length;
        console.log(`Indexed ${indexed}...`);
      }
      await this.opensearch.client.indices.refresh({ index: INDEX_NAME });
      console.log(`Done. Indexed ${indexed} products into '${INDEX_NAME}'.`);
    } finally {
      await this.database.disconnect();
    }
  }

  private async indexBatch(documents: ProductDocument[]): Promise<void> {
    const operations = documents.flatMap((document) => [
      { index: { _index: INDEX_NAME, _id: document.id } },
      document,
    ]);
    const response = await this.opensearch.client.bulk({ body: operations });
    const body = response.body as BulkResponse;
    if (body.errors) {
      const failure = body.items.find((item) => item.index?.error);
      throw new Error(
        `Bulk indexing failed: ${JSON.stringify(failure?.index?.error)}`
      );
    }
  }
}
