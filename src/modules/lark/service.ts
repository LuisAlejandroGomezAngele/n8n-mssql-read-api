import axios from "axios";
import { env } from "../../config/env";
import { listResource } from "../../modules/common/repo";

export type LarkFieldsOpts = {
  appId: string;
  tableId: string;
  pageSize?: number;
  viewId?: string;
  token?: string; // override from env
};

type Session = {
  app_access_token?: string;
  tenant_access_token?: string;
  expire?: number; // epoch seconds
  // other fields possible
};

// In-memory session cache (no file storage)
let memorySession: Session | null = null;

export function getSessionSummary() {
  if (!memorySession) return null;
  return {
    has_app_access_token: !!memorySession.app_access_token,
    has_tenant_access_token: !!memorySession.tenant_access_token,
    expire: memorySession.expire,
  };
}

async function authenticateApp(): Promise<Session> {
  const base = env.larkBase ?? "https://open.larksuite.com";
  const target = `${base}/open-apis/auth/v3/app_access_token/internal`;
  const appId = env.larkAppId;
  const appSecret = env.larkAppSecret;
  if (!appId || !appSecret) throw new Error("missing_lark_app_credentials");

  const resp = await axios.post(target, { app_id: appId, app_secret: appSecret }, { timeout: 10000 });
  // Response shape: { app_access_token, expire, tenant_access_token?, code?, msg? }
  const data = resp.data;
  const expire = Number(data.expire ?? 0);
  const now = Math.floor(Date.now() / 1000);
  const sess: Session = {
    app_access_token: data.app_access_token,
    tenant_access_token: data.tenant_access_token,
    expire: now + expire,
  };
  memorySession = sess;
  // Debug: log that authentication succeeded and which tokens are present (do NOT print full tokens)
  try {
    console.info("Lark authenticate: got tokens present:", {
      has_app_access_token: !!sess.app_access_token,
      has_tenant_access_token: !!sess.tenant_access_token,
      expire_at: sess.expire,
    });
  } catch (e) {
    // ignore logging errors
  }
  return sess;
}

async function getAppToken(): Promise<string> {
  // priority: explicit env LARK_TOKEN, then cached session via app credentials
  if (env.larkToken) return env.larkToken;

  const now = Math.floor(Date.now() / 1000);
  // Prefer tenant_access_token when available (bitable/table APIs usually need tenant token).
  if (memorySession && memorySession.expire && memorySession.expire > now + 5) {
    return memorySession.tenant_access_token ?? memorySession.app_access_token!;
  }

  // need to authenticate
  const newSess = await authenticateApp();
  if (!newSess.app_access_token) throw new Error("failed_lark_auth");
  return newSess.app_access_token;
}

export async function getLarkFields(opts: LarkFieldsOpts) {
  const base = env.larkBase ?? "https://open.larksuite.com";
  const token = opts.token ?? await getAppToken();
  if (!token) throw new Error("missing_lark_token");
  const url = `${base}/open-apis/bitable/v1/apps/${encodeURIComponent(opts.appId)}/tables/${encodeURIComponent(opts.tableId)}/fields`;
  const params: Record<string, any> = { page_size: opts.pageSize ?? 20 };
  if (opts.viewId) params.view_id = opts.viewId;

  const resp = await axios.get(url, {
    params,
    headers: { Authorization: `Bearer ${token}` },
    timeout: 10000,
  });

  return resp.data;
}

export type BatchCreateOpts = {
  appId: string;
  tableId: string;
  records: any[];
  token?: string;
};

export async function batchCreateRecords(opts: BatchCreateOpts) {
  const base = env.larkBase ?? "https://open.larksuite.com";
  const token = opts.token ?? await getAppToken();
  if (!token) throw new Error("missing_lark_token");

  const url = `${base}/open-apis/bitable/v1/apps/${encodeURIComponent(opts.appId)}/tables/${encodeURIComponent(opts.tableId)}/records/batch_create`;

  const resp = await axios.post(url, { records: opts.records }, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    timeout: 15000,
  });

  return resp.data;
}

export type BatchUpdateOpts = {
  appId: string;
  tableId: string;
  records: any[]; // each record must include record_id and fields
};

export async function batchUpdateRecords(opts: BatchUpdateOpts) {
  const base = env.larkBase ?? "https://open.larksuite.com";
  const token = await getAppToken();
  if (!token) throw new Error("missing_lark_token");

  const url = `${base}/open-apis/bitable/v1/apps/${encodeURIComponent(opts.appId)}/tables/${encodeURIComponent(opts.tableId)}/records/batch_update`;

  const resp = await axios.post(url, { records: opts.records }, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    timeout: 15000,
  });

  return resp.data;
}

export type SearchOpts = {
  appId: string;
  tableId: string;
  pageSize?: number;
  body: any; // search payload (filter, field_names, view_id, etc.)
  token?: string;
};

export async function searchRecords(opts: SearchOpts) {
  const base = env.larkBase ?? "https://open.larksuite.com";
  const token = opts.token ?? await getAppToken();
  if (!token) throw new Error("missing_lark_token");

  const url = `${base}/open-apis/bitable/v1/apps/${encodeURIComponent(opts.appId)}/tables/${encodeURIComponent(opts.tableId)}/records/search`;
  const params: Record<string, any> = {};
  if (opts.pageSize) params.page_size = opts.pageSize;

  const resp = await axios.post(url, opts.body, {
    params,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    timeout: 15000,
  });

  return resp.data;
}

export type SyncResult = {
  created: number;
  updated: number;
  errors: Array<{ productId: string | number; error: any }>;
};

export async function syncProductsToBitable(opts: { appId: string; tableId: string; viewId?: string; pageSize?: number; dbPageSize?: number; }) : Promise<SyncResult> {
  const { appId, tableId, viewId, pageSize = 20, dbPageSize = 100 } = opts;
  const res: SyncResult = { created: 0, updated: 0, errors: [] };

  let page = 1;
  while (true) {
    let data: any;
    try {
      data = await listResource("productos", { page, size: dbPageSize });
    } catch (err:any) {
      console.error("Error reading resource 'productos' page", page, String(err));
      throw err;
    }
    const items: any[] = data.items ?? [];
    console.log(items)
    if (!items.length) break;
    for (const item of items) {
      try {
        const pid = item.productId ?? item.product_id ?? item.productid ?? null;
        if (pid == null) continue;

        const payload: any = {
          automatic_fields: false,
          field_names: ["productId"],
          filter: {
            children: [
              {
                conditions: [
                  { field_name: "productId", operator: "is", value: [String(pid)] }
                ],
                conjunction: "or"
              }
            ],
            conjunction: "and"
          }
        };
        if (viewId) payload.view_id = viewId;

        const searchResp: any = await searchRecords({ appId, tableId, pageSize, body: payload });

        // try multiple possible response shapes to find records
        let foundRecords: any[] = [];
        if (Array.isArray(searchResp?.records)) foundRecords = searchResp.records;
        else if (Array.isArray(searchResp?.data?.records)) foundRecords = searchResp.data.records;
        else if (Array.isArray(searchResp?.items)) foundRecords = searchResp.items;
        else if (Array.isArray(searchResp?.data?.items)) foundRecords = searchResp.data.items;

        if (foundRecords.length) {
          const recordId = foundRecords[0].record_id ?? foundRecords[0].recordId ?? foundRecords[0].id ?? foundRecords[0].record_id;
          if (!recordId) {
            // cannot update without record id; skip
            res.errors.push({ productId: pid, error: "no_record_id_found" });
            continue;
          }
          const upd = [{ record_id: recordId, fields: item }];
          await batchUpdateRecords({ appId, tableId, records: upd });
          res.updated++;
        } else {
          const crt = [{ fields: item }];
          await batchCreateRecords({ appId, tableId, records: crt });
          res.created++;
        }
      } catch (e: any) {
        const errInfo = e?.response?.data ?? e.message ?? e;
        res.errors.push({ productId: item?.productId ?? null, error: errInfo });
        // Log full error server-side for debugging (include stack if available)
        console.error("syncProductsToBitable error for product", item?.productId ?? item, errInfo, e.stack ?? "no-stack");
      }
    }

    if (items.length < dbPageSize) break;
    page++;
  }

  return res;
}
