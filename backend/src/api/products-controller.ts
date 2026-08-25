import { NextFunction, Request, Response } from "express";
import { ListingQueryParser } from "./listing-query-parser";
import { ProductListingService } from "./product-listing-service";

export class ProductsController {
  constructor(
    private readonly service = new ProductListingService(),
    private readonly parser = new ListingQueryParser()
  ) {}

  handle = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const query = this.parser.parse(req.query);
      res.json(await this.service.list(query));
    } catch (error) {
      next(error);
    }
  };
}
