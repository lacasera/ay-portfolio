import "dotenv/config";
import cors from "cors";
import express from "express";
import { ApiServer } from "./api/server";
import { ErrorMiddleware } from "./api/shared/error-middleware";

const PORT = process.env.PORT ?? 3001;

new ApiServer()
  .use(cors())
  .use(express.json())
  .registerRoutes()
  .use(new ErrorMiddleware().handle)
  .start(PORT);
