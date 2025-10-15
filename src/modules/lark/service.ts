import axios from "axios";
import { env } from "../../config/env";

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
    console.log('Lark Token:', token);
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
