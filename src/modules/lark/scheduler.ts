import cron from "node-cron";
import { env } from "../../config/env";
import { syncProductsToBitable, getSessionSummary } from "./service";

const APP_ID = "UhZsbjigTaIkals1qFBl1yPKgAg"; 
const TABLE_ID = "tblOiTn4HRBZtYP7";
const VIEW_ID = "vewbLZlxbL";

let task: cron.ScheduledTask | null = null;

export function startScheduler() {
  if (!env.scheduleEnabled) return;
  const cronExpr = env.scheduleCron;
  task = cron.schedule(cronExpr, async () => {
    // Log immediately when cron triggers the task
    console.info("[lark-scheduler] task activated (cron triggered) at", new Date().toISOString());
    try {
      console.info("[lark-scheduler] running syncProductsToBitable at", new Date().toISOString());
      const mem = getSessionSummary();
      console.info("[lark-scheduler] token present:", mem);
  const res = await syncProductsToBitable({ appId: APP_ID, tableId: TABLE_ID, viewId: VIEW_ID, dbPageSize: 100 });
      console.info("[lark-scheduler] sync result:", res);
    } catch (e:any) {
      console.error("[lark-scheduler] error executing sync:", e?.message ?? e);
    }
  }, { scheduled: true });
  console.info("[lark-scheduler] scheduled with:", cronExpr);
}

export function stopScheduler() {
  if (task) task.stop();
}
