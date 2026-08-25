import express, {
  ErrorRequestHandler,
  Request,
  RequestHandler,
  Response,
} from "express";
import { HealthController } from "./health-controller";
import { ProductsController } from "./products-controller";
import { SearchController } from "./search-controller";

type Middleware = RequestHandler | ErrorRequestHandler;

export class ApiServer {
  private readonly app = express();

  constructor(
    private readonly search = new SearchController(),
    private readonly products = new ProductsController(),
    private readonly health = new HealthController()
  ) {}

  use(...handlers: Middleware[]): this {
    this.app.use(...handlers);
    return this;
  }

  registerRoutes(): this {
    this.app.get("/health", this.health.handle);
    this.app.post("/api/search", this.search.handle);
    this.app.get("/api/products", this.products.handle);
    this.app.get("/api/hello", (_req: Request, res: Response) => {
      res.json({ message: "Hello from the Express backend!" });
    });
    return this;
  }

  start(port: number | string): void {
    this.app.listen(port, () => {
      console.log(`Backend listening on http://localhost:${port}`);
    });
  }
}
