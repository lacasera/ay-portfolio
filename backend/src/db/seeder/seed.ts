import "reflect-metadata";
import "dotenv/config";
import { CatalogSeeder } from "./catalog-seeder";

new CatalogSeeder().run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
