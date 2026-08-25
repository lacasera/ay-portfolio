import {
  DataSource,
  EntityManager,
  EntityTarget,
  ObjectLiteral,
  Repository,
} from "typeorm";
import { Product } from "./product.entity";

export class Database {
  private readonly dataSource: DataSource;

  constructor(connectionUrl = process.env.DATABASE_URL) {
    if (!connectionUrl) {
      throw new Error("DATABASE_URL is not set");
    }
    this.dataSource = new DataSource({
      type: "postgres",
      url: connectionUrl,
      entities: [Product],
      synchronize: true,
      logging: false,
    });
  }

  async connect(): Promise<void> {
    if (!this.dataSource.isInitialized) {
      await this.dataSource.initialize();
    }
  }

  async disconnect(): Promise<void> {
    if (this.dataSource.isInitialized) {
      await this.dataSource.destroy();
    }
  }

  getRepository<T extends ObjectLiteral>(
    entity: EntityTarget<T>
  ): Repository<T> {
    return this.dataSource.getRepository(entity);
  }

  transaction<T>(work: (manager: EntityManager) => Promise<T>): Promise<T> {
    return this.dataSource.transaction(work);
  }
}
