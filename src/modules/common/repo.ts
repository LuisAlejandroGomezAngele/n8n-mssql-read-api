import { QueryTypes } from "sequelize";
import { sequelize } from "../../db/sequelize";
import { RESOURCES } from "./resources";

function ensureResource(name: string) {
  const cfg = RESOURCES[name];
  if (!cfg) throw new Error("resource_not_found");
  return cfg;
}
function ensureSort(cfg: any, sort: string) {
  if (sort === "1") return null;
  if (!cfg.allowSort?.includes(sort)) throw new Error("invalid_sort");
  return sort;
}
function ensureFilter(cfg: any, filters: Record<string, string>) {
  const allowed = new Set(cfg.allowFilter ?? []);
  const out: Record<string, string> = {};
  for (const [c, v] of Object.entries(filters)) {
    if (!allowed.has(c)) continue;
    const val = String(v ?? "").trim();
    if (!val) continue; // ignora vacíos
    out[c] = val;
  }
  return out;
}
function quoteId(id: string) {
  if (!/^[A-Za-z0-9_]+$/.test(id)) throw new Error("invalid_identifier");
  return `[${id}]`;
}

export async function listResource(
  resource: string,
  opts: {
    page?: number;
    size?: number;
    sort?: string;
    dir?: "asc" | "desc";
    filters?: Record<string, string>;
  }
) {
  const cfg = ensureResource(resource);
  const page = Math.max(opts.page ?? 1, 1);
  const size = Math.min(Math.max(opts.size ?? 50, 1), 200);
  const off = (page - 1) * size;
  const sortCol = ensureSort(cfg, opts.sort ?? "1");
  const dir = (opts.dir ?? "asc").toLowerCase() === "desc" ? "DESC" : "ASC";
  const filters = ensureFilter(cfg, { ...(opts.filters ?? {}) });

  const whereParts: string[] = [];
  const repl: Record<string, any> = {};
  let i = 0;
  for (const [col, val] of Object.entries(filters)) {
    i++;
    whereParts.push(`${quoteId(col)} LIKE :p${i}`);
    repl[`p${i}`] = `%${val}%`;
  }
  const whereSql = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";
  const orderSql = sortCol ? `ORDER BY ${quoteId(sortCol)} ${dir}` : "";
  const view = cfg.view;

  const items = await sequelize.query(
    `SELECT * FROM ${quoteId(view)} ${whereSql} ${orderSql} OFFSET :off ROWS FETCH NEXT :sz ROWS ONLY`,
    { replacements: { ...repl, off, sz: size }, type: QueryTypes.SELECT }
  );

  const totalRow = await sequelize.query<{ cnt: number }>(
    `SELECT COUNT(1) AS cnt FROM ${quoteId(view)} ${whereSql}`,
    { replacements: repl, type: QueryTypes.SELECT }
  );
  const total = Number((totalRow[0] as any)?.cnt ?? 0);

  return { items, page, size, total };
}

export async function getById(resource: string, id: string, idCol?: string) {
  const cfg = ensureResource(resource);
  const col = idCol ?? cfg.pk ?? "Id";
  if (cfg.pk && idCol && idCol !== cfg.pk) throw new Error("invalid_idCol");

  const rows = await sequelize.query(
    `SELECT TOP 1 * FROM ${quoteId(cfg.view)} WHERE ${quoteId(col)} = :id`,
    { replacements: { id }, type: QueryTypes.SELECT }
  );
  if (!rows.length) return null;
  return rows[0];
}

export async function getOrderByCustomerAndBill(
  resource: string,
  customerCode: string,
  billCode: string
) {
  const cfg = ensureResource(resource);

  const viewCandidates = [
    `${cfg.view}`
  ];

  for (const v of viewCandidates) {
    try {
      const rows = await sequelize.query(
        `SELECT * FROM ${quoteId(v)} WHERE customerCode = :cust AND BillCode = :bill`,
        { replacements: { cust: customerCode, bill: billCode }, type: QueryTypes.SELECT }
      );
      if (rows.length) return rows[0];
    } catch (e) {
      // ignorar y probar siguiente candidata
    }
  }
  // Si ninguna candidata funcionó, lanzar recurso no encontrado para que la ruta devuelva 404
  throw new Error("resource_not_found");
}

export async function listOrdersByCustomer(resource: string, customerCode: string) {
  const cfg = ensureResource(resource);
  const viewCandidates = [
    `${cfg.view}`,
  ];

  for (const v of viewCandidates) {
    try {
      const rows = await sequelize.query(
        `SELECT * FROM ${quoteId(v)} WHERE customerCode = :cust ORDER BY CreateDate DESC`,
        { replacements: { cust: customerCode }, type: QueryTypes.SELECT }
      );
      return rows;
    } catch (e) {
      // seguir con la siguiente candidata
    }
  }
  throw new Error("resource_not_found");
}
