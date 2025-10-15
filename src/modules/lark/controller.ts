import { Router } from "express";
import { getLarkFields } from "./service";

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

export default r;
