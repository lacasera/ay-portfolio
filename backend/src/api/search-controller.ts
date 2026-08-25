import { NextFunction, Request, Response } from "express";
import { SearchRequestParser } from "./search-request-parser";
import { SearchService } from "./search-service";

export class SearchController {
  constructor(
    private readonly service = new SearchService(),
    private readonly parser = new SearchRequestParser()
  ) {}

  handle = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const request = this.parser.parse(req.body);
      res.json(await this.service.search(request));
    } catch (error) {
      next(error);
    }
  };
}
