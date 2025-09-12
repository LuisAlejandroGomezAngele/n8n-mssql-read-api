import { Sequelize } from "sequelize";
import { env } from "../config/env";

export const sequelize = new Sequelize(env.db.database, env.db.username, env.db.password, {
  host: env.db.host,
  dialect: "mssql",
  logging: false,
  pool: { max: 10, min: 0, idle: 10000, acquire: 30000 },
  dialectOptions: { options: { encrypt: env.db.encrypt } }
});

export async function assertDb() {
  await sequelize.authenticate();
}

export async function healthcheck() {
  try {
    await sequelize.query("SELECT 1 AS ok");
    return { connected: true };
  } catch (e:any) {
    return { connected: false, error: e.message };
  }
}
