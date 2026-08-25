import { EntityManager } from "typeorm";
import { Database } from "../database";
import { Product } from "../product.entity";
import { CatalogCsvReader } from "./catalog-csv-reader";
import { ProductValidator } from "./product-validator";
import { SeedSummary } from "./seed-summary";

const INSERT_CHUNK_SIZE = 500;

export class CatalogSeeder {
  constructor(
    private readonly reader = new CatalogCsvReader(),
    private readonly validator = new ProductValidator(),
    private readonly database = new Database()
  ) {}

  async run(): Promise<void> {
    await this.database.connect();
    try {
      const summary = new SeedSummary();
      await this.database.transaction(async (manager) => {
        await manager.clear(Product);
        let batch: Product[] = [];
        for await (const product of this.reader.read()) {
          summary.record(product);
          batch.push(product);
          if (batch.length >= INSERT_CHUNK_SIZE) {
            await this.flush(manager, batch);
            batch = [];
          }
        }
        await this.flush(manager, batch);
      });

      const stored = await this.database.getRepository(Product).count();
      console.log(
        `Seeded ${summary.count} products; table now holds ${stored}.`
      );
      console.log(summary.format());
    } finally {
      await this.database.disconnect();
    }
  }

  private async flush(manager: EntityManager, batch: Product[]): Promise<void> {
    if (batch.length === 0) return;
    this.validator.validate(batch);
    await manager.insert(Product, batch);
  }
}
