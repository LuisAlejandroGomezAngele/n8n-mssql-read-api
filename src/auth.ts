import { timingSafeEqual } from "crypto";
import { Request, Response, NextFunction } from "express";
import { env } from "./config/env";

export function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const provided = String(req.header("x-api-key") ?? "");
  if (!provided) return res.status(401).json({ error: "missing_api_key" });
  for (const k of env.apiKeys) {
    if (k.length === provided.length &&
        timingSafeEqual(Buffer.from(k), Buffer.from(provided))) return next();
  }
  return res.status(403).json({ error: "invalid_api_key" });
}
