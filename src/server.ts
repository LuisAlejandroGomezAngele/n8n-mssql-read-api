import { env } from "./config/env";
import app from "./app";
import { assertDb } from "./db/sequelize";

assertDb()
  .then(() => {
    console.log("✅ Conexión a SQL Server exitosa");
    app.listen(env.port, () => console.log(`HTTP listo en :${env.port}`));
  })
  .catch(err => {
    console.error("❌ Error conectando a SQL Server:", err.message);
    process.exit(1);
  });
