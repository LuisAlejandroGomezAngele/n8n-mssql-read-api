import path from "path";
import swaggerJSDoc, { Options } from "swagger-jsdoc";

const options: Options = {
  definition: {
    openapi: "3.0.3",
    info: { title: "n8n MSSQL Read API", version: "1.0.0" },
    components: { securitySchemes: { ApiKeyAuth: { type: "apiKey", in: "header", name: "x-api-key" } } },
    security: [{ ApiKeyAuth: [] }]
  },
  apis: [
    path.resolve(process.cwd(), "src/**/*.ts"),
    path.resolve(process.cwd(), "dist/**/*.js") // si corres compilado
  ],
};
export const specs = swaggerJSDoc(options);
