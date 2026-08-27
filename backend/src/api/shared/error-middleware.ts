import { NextFunction, Request, Response } from "express";
import { ModelNotDeployedError } from "../../search/model-registry";
import { ValidationError } from "./search-types";

export class ErrorMiddleware {
  handle = (
    error: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
  ): void => {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
      return;
    }
    if (error instanceof ModelNotDeployedError) {
      res.status(503).json({ error: error.message });
      return;
    }
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  };
}
