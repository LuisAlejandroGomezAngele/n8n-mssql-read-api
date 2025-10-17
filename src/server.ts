import { env } from "./config/env";
import app from "./app";
import { assertDb } from "./db/sequelize";
import { startScheduler } from "./modules/lark/scheduler";

assertDb()
  .then(() => {
    console.log("✅ Conexión a SQL Server exitosa");
    app.listen(env.port, () => {
      console.log(`HTTP listo en :${env.port}`);
      try { startScheduler(); } catch (e) { console.error('Failed to start scheduler', e); }
    });
  })
  .catch(err => {
    console.error("❌ Error conectando a SQL Server:", err.message);
    process.exit(1);
  });
