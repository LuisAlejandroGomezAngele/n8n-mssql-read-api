import { Router } from "express";
import { getLarkFields, batchCreateRecords, batchUpdateRecords, searchRecords } from "./service";
import { syncProductsToBitable, getSessionSummary } from "./service";

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

/**
 * POST /v1/lark/records/search
 * Body: { appId, tableId, pageSize, body }
 */
r.post("/records/search", async (req, res) => {
  try {
    const body = req.body ?? {};
    const appId = String(body.appId ?? "").trim();
    const tableId = String(body.tableId ?? "").trim();
    const pageSize = body.pageSize ? Number(body.pageSize) : undefined;
    const payload = body.body ?? body.payload ?? null;
    if (!payload) {
      return res.status(400).json({ error: "invalid_payload" });
    }
    if (!appId) {
      return res.status(400).json({ error: "invalid_appId" });
    }
    if (!tableId) {
      return res.status(400).json({ error: "invalid_tableId" });
    }


    const data = await searchRecords({ appId, tableId, pageSize, body: payload });
    res.json({ data });
  } catch (e: any) {
    if (e.message === "missing_lark_token") return res.status(500).json({ error: e.message });
    const status = e.response?.status ?? 500;
    const body = e.response?.data ?? { message: e.message };
    res.status(status).json({ error: body });
  }
});

/**
 * POST /v1/lark/sync/products
 * Body: { appId, tableId, viewId?, dbPageSize?, pageSize? }
 */
r.post("/sync/products", async (req, res) => {
  try {
    const body = req.body ?? {};
    const appId = String(body.appId ?? "").trim();
    const tableId = String(body.tableId ?? "").trim();
    const viewId = body.viewId ? String(body.viewId) : undefined;
    const dbPageSize = body.dbPageSize ? Number(body.dbPageSize) : undefined;
    const pageSize = body.pageSize ? Number(body.pageSize) : undefined;
    if (!appId || !tableId) return res.status(400).json({ error: "invalid_payload" });

    const result = await syncProductsToBitable({ appId, tableId, viewId, dbPageSize, pageSize });
    res.json({ data: result });
  } catch (e: any) {
    const status = e.response?.status ?? 500;
    const body = e.response?.data ?? { message: e.message };
    res.status(status).json({ error: body });
  }
});

// Convenience endpoints for chunk sizes
r.post("/sync/products/50", async (req, res) => {
  try {
    const body = req.body ?? {};
    const appId = String(body.appId ?? "").trim();
    const tableId = String(body.tableId ?? "").trim();
    const viewId = body.viewId ? String(body.viewId) : undefined;
    const pageSize = body.pageSize ? Number(body.pageSize) : undefined;
    if (!appId || !tableId) return res.status(400).json({ error: "invalid_payload" });

    const result = await syncProductsToBitable({ appId, tableId, viewId, dbPageSize: 50, pageSize });
    res.json({ data: result });
  } catch (e: any) {
    const status = e.response?.status ?? 500;
    const body = e.response?.data ?? { message: e.message };
    res.status(status).json({ error: body });
  }
});

r.post("/sync/products/100", async (req, res) => {
  try {
    const body = req.body ?? {};
    const appId = String(body.appId ?? "").trim();
    const tableId = String(body.tableId ?? "").trim();
    const viewId = body.viewId ? String(body.viewId) : undefined;
    const pageSize = body.pageSize ? Number(body.pageSize) : undefined;
    if (!appId || !tableId) return res.status(400).json({ error: "invalid_payload" });

    const result = await syncProductsToBitable({ appId, tableId, viewId, dbPageSize: 100, pageSize });
    res.json({ data: result });
  } catch (e: any) {
    const status = e.response?.status ?? 500;
    const body = e.response?.data ?? { message: e.message };
    res.status(status).json({ error: body });
  }
});

/**
 * GET /v1/lark/debug/session
 * Returns a debug-safe summary of in-memory session (no tokens)
 */
r.get("/debug/session", async (_req, res) => {
  try {
    const mem = getSessionSummary();
    return res.json({ ok: true, session: mem });
  } catch (e:any) {
    res.status(500).json({ error: String(e) });
  }
});

export default r;

