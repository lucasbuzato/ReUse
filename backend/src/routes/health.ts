import { Router } from "express";
import { config } from "../config.js";
import { noStore } from "../lib/http.js";
import { prisma } from "../lib/prisma.js";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res) => {
  noStore(res);
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "ok",
      database: "ok",
      databaseLatencyMs: Date.now() - startedAt,
      version: config.version,
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check: banco indisponível", error);
    res.status(503).json({ status: "degraded", database: "error", version: config.version, timestamp: new Date().toISOString() });
  }
});
