import { NextFunction, Request, Response } from "express";
import { HealthService } from "./health-service";

export class HealthController {
  constructor(private readonly service = new HealthService()) {}

  handle = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const report = await this.service.check();
      res.status(report.status === "healthy" ? 200 : 503).json(report);
    } catch (error) {
      next(error);
    }
  };
}
