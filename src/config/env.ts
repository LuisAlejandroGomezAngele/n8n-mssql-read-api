import "dotenv/config";
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
};
