import "reflect-metadata";
import "dotenv/config";
import { ProductIndexer } from "./product-indexer";

new ProductIndexer().run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
