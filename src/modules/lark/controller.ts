import { Router } from "express";
import { getLarkFields, batchCreateRecords, batchUpdateRecords } from "./service";

const r = Router();

/**
 * GET /v1/lark/fields
 * Query params: appId, tableId, pageSize, viewId
 */
r.get("/fields", async (req, res) => {
  try {
    const appId = String(req.query.appId ?? "").trim();
    const tableId = String(req.query.tableId ?? "").trim();
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined;
    const viewId = req.query.viewId ? String(req.query.viewId) : undefined;
    if (!appId || !tableId) return res.status(400).json({ error: "invalid_app_or_table" });

    const data = await getLarkFields({ appId, tableId, pageSize, viewId });
    res.json({ data });
  } catch (e: any) {
    if (e.message === "missing_lark_token") return res.status(500).json({ error: e.message });
    const status = e.response?.status ?? 500;
    const body = e.response?.data ?? { message: e.message };
    res.status(status).json({ error: body });
  }
});

/**
 * POST /v1/lark/records
 * Body: { appId, tableId, records }
 */
r.post("/records", async (req, res) => {
  try {
    const body = req.body ?? {};
    const appId = String(body.appId ?? "").trim();
    const tableId = String(body.tableId ?? "").trim();
    const records = body.records;
    if (!appId || !tableId || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: "invalid_payload" });
    }

    const data = await batchCreateRecords({ appId, tableId, records });
    res.json({ data });
  } catch (e: any) {
    if (e.message === "missing_lark_token") return res.status(500).json({ error: e.message });
    const status = e.response?.status ?? 500;
    const body = e.response?.data ?? { message: e.message };
    res.status(status).json({ error: body });
  }
});

/**
 * POST /v1/lark/records/create
 * Alias explícito para crear registros (batch_create). Mantengo /records como compatibilidad.
 */
r.post("/records/create", async (req, res) => {
  try {
    const body = req.body ?? {};
    const appId = String(body.appId ?? "").trim();
    const tableId = String(body.tableId ?? "").trim();
    const records = body.records;
    if (!appId || !tableId || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: "invalid_payload" });
    }

    const data = await batchCreateRecords({ appId, tableId, records });
    res.json({ data });
  } catch (e: any) {
    if (e.message === "missing_lark_token") return res.status(500).json({ error: e.message });
    const status = e.response?.status ?? 500;
    const body = e.response?.data ?? { message: e.message };
    res.status(status).json({ error: body });
  }
});

/**
 * POST /v1/lark/records/update
 * POST /v1/lark/records/batch_update
 * Body: { appId, tableId, records }
 */
r.post(["/records/update", "/records/batch_update"], async (req, res) => {
  try {
    const body = req.body ?? {};
    const appId = String(body.appId ?? "").trim();
    const tableId = String(body.tableId ?? "").trim();
    const records = body.records;
    if (!appId || !tableId || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: "invalid_payload" });
    }

    const data = await batchUpdateRecords({ appId, tableId, records });
    res.json({ data });
  } catch (e: any) {
    if (e.message === "missing_lark_token") return res.status(500).json({ error: e.message });
    const status = e.response?.status ?? 500;
    const body = e.response?.data ?? { message: e.message };
    res.status(status).json({ error: body });
  }
});

export default r;

