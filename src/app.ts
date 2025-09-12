import express from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { specs } from "./docs/swagger";
import { requireApiKey } from "./auth";
import routes from "./modules/common/routes";
import { healthcheck } from "./db/sequelize";

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// Swagger público
app.use("/docs", swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }));
app.get("/openapi.json", (_req, res) => res.json(specs));

// Health
app.get("/health", async (_req, res) => {
  const db = await healthcheck();
  res.json({ ok: db.connected, db });
});

// API protegida
app.use("/v1", requireApiKey, routes);

// (opcional) 404 genérico al final
// app.use((_req,res)=>res.status(404).json({error:"not_found"}));

export default app;
