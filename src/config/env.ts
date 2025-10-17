import "dotenv/config";
import path from "path";

export const env = {
  port: Number(process.env.PORT ?? 3000),
  db: {
    host: process.env.SQL_SERVER!,
    database: process.env.SQL_DB!,
    username: process.env.SQL_USER!,
    password: process.env.SQL_PASSWORD!,
    encrypt: process.env.SQL_ENCRYPT === "true",
  },
  apiKeys: (process.env.API_KEYS ?? "").split(",").map(s=>s.trim()).filter(Boolean),
  // Lark (optional)
  larkToken: process.env.LARK_TOKEN,
  larkBase: process.env.LARK_BASE,
  // For app-level authentication (app_id + app_secret)
  larkAppId: process.env.LARK_APP_ID,
  larkAppSecret: process.env.LARK_APP_SECRET,
  // Note: token caching is done in memory by the service (no file storage)
  // Scheduler
  scheduleEnabled: process.env.SCHEDULE_LARK_SYNC_ENABLED === "true",
  scheduleCron: process.env.SCHEDULE_LARK_SYNC_CRON ?? "0 6 * * *",
  larkTableId: process.env.LARK_TABLE_ID,
};
