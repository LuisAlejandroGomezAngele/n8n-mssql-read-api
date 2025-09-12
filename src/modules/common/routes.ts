import { Router } from "express";
import { listResource, getById } from "./repo";

const r = Router();

import { getOrderByCustomerAndBill, listOrdersByCustomer } from "./repo";

/**
 * @openapi
 * /v1/{res}/items:
 *   get:
 *     tags:
 *       - Resources
 *     summary: Lista items desde una vista permitida
 *     parameters:
 *       - in: path
 *         name: res
 *         required: true
 *         description: Recurso configurado (ej. productos, inventarios)
 *         schema:
 *           type: string
 *           example: productos
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 200
 *           default: 50
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           example: Nombre
 *       - in: query
 *         name: dir
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *       - in: query
 *         name: filter
 *         style: deepObject
 *         explode: true
 *         description: Filtros por columna whitelisteada.
 *         schema:
 *           type: object
 *           additionalProperties:
 *             type: string
 *         examples:
 *           porNombre:
 *             value: { Nombre: "foco" }
 *           multiple:
 *             value: { Codigo: "000162", Almacen: "GDL" }
 *     responses:
 *       "200": { description: OK }
 *       "400": { description: Parámetros inválidos }
 *       "401": { description: Falta API key }
 *       "403": { description: API key inválida }
 *       "404": { description: Recurso no encontrado }
 */
r.get("/:res/items", async (req, res) => {
  try {
    const filters: Record<string, string> = {};

    // Soporta deepObject: filter[Col]=val
    const q: any = req.query;
    if (q.filter && typeof q.filter === "object") {
      for (const [k, v] of Object.entries(q.filter)) {
        const val = String(v ?? "").trim();
        if (val) filters[k] = val;
      }
    }
    // Soporta legado: filter[Col]=val como claves planas
    for (const [k, v] of Object.entries(req.query)) {
      if (k.startsWith("filter[") && k.endsWith("]")) {
        const val = String(v ?? "").trim();
        if (val) filters[k.slice(7, -1)] = val;
      }
    }

    const data = await listResource(String(req.params.res), {
      page: Number(req.query.page ?? 1),
      size: Number(req.query.size ?? 50),
      sort: String(req.query.sort ?? "1"),
      dir: (String(req.query.dir ?? "asc") as "asc" | "desc"),
      filters,
    });
    res.json({ data });
  } catch (e: any) {
    const msg =
      e.message === "resource_not_found"
        ? 404
        : e.message.startsWith("invalid_")
        ? 400
        : 500;
    res.status(msg).json({ error: e.message });
  }
});

/**
 * @openapi
 * /v1/{res}/items/{id}:
 *   get:
 *     tags:
 *       - Resources
 *     summary: Obtiene un item por ID
 *     parameters:
 *       - in: path
 *         name: res
 *         required: true
 *         schema: { type: string, example: productos }
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: "166401" }
 *       - in: query
 *         name: idCol
 *         description: Columna ID a usar. Por defecto la pk configurada del recurso.
 *         schema: { type: string, example: ProductId }
 *     responses:
 *       "200": { description: OK }
 *       "400": { description: Parámetros inválidos }
 *       "401": { description: Falta API key }
 *       "403": { description: API key inválida }
 *       "404": { description: No encontrado }
 */
r.get("/:res/items/:id", async (req, res) => {
  try {
    const item = await getById(
      String(req.params.res),
      String(req.params.id),
      req.query.idCol as string | undefined
    );
    if (!item) return res.status(404).json({ error: "not_found" });
    res.json({ data: { item } });
  } catch (e: any) {
    const msg = e.message.startsWith("invalid_") ? 400 : 500;
    res.status(msg).json({ error: e.message });
  }
});

export default r;

/**
 * Rutas de órdenes
 */
/**
 * @openapi
 * /v1/{res}/orders:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Obtiene órdenes de un cliente o una orden específica
 *     parameters:
 *       - in: path
 *         name: res
 *         required: true
 *         description: Recurso configurado (ej. customers)
 *         schema:
 *           type: string
 *           example: customers
 *       - in: query
 *         name: customercode
 *         required: true
 *         description: Código del cliente
 *         schema:
 *           type: string
 *           example: ABC123
 *       - in: query
 *         name: billcode
 *         required: false
 *         description: Código de la factura/orden (opcional). Si se provee devuelve una sola orden.
 *         schema:
 *           type: string
 *           example: BILL001
 *     responses:
 *       "200":
 *         description: OK
 *       "400":
 *         description: Parámetros inválidos
 *       "401":
 *         description: Falta API key
 *       "403":
 *         description: API key inválida
 *       "404":
 *         description: Recurso o orden no encontrado
 */
/**
 * GET /v1/{res}/orders?customercode=...&billcode=...
 * - `customercode` requerido
 * - `billcode` opcional: si se envia, devuelve la orden específica
 */
r.get("/:res/orders", async (req, res) => {
  try {
    const customerCode = String(req.query.customercode ?? "").trim();
    const billCode = req.query.billcode ? String(req.query.billcode).trim() : undefined;
    if (!customerCode) return res.status(400).json({ error: "invalid_customercode" });

    if (billCode) {
      const order = await getOrderByCustomerAndBill(String(req.params.res), customerCode, billCode);
      if (!order) return res.status(404).json({ error: "not_found" });
      return res.json({ data: { order } });
    }

    const orders = await listOrdersByCustomer(String(req.params.res), customerCode);
    return res.json({ data: { orders } });
  } catch (e: any) {
    const msg = e.message === "resource_not_found" ? 404 : e.message.startsWith("invalid_") ? 400 : 500;
    res.status(msg).json({ error: e.message });
  }
});

/**
 * Compat: GET /v1/{res}/orders/{billcode}?customercode=...
 */
/**
 * @openapi
 * /v1/{res}/orders/{billcode}:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Obtiene una orden específica por billcode y customercode
 *     parameters:
 *       - in: path
 *         name: res
 *         required: true
 *         schema: { type: string, example: customers }
 *       - in: path
 *         name: billcode
 *         required: true
 *         description: Código de la factura/orden
 *         schema:
 *           type: string
 *           example: BILL001
 *       - in: query
 *         name: customercode
 *         required: true
 *         description: Código del cliente
 *         schema:
 *           type: string
 *           example: ABC123
 *     responses:
 *       "200": { description: OK }
 *       "400": { description: Parámetros inválidos }
 *       "401": { description: Falta API key }
 *       "403": { description: API key inválida }
 *       "404": { description: No encontrado }
 */
r.get("/:res/orders/:billcode", async (req, res) => {
  try {
    const customerCode = String(req.query.customercode ?? "").trim();
    const billCode = String(req.params.billcode ?? "").trim();
    if (!customerCode) return res.status(400).json({ error: "invalid_customercode" });
    if (!billCode) return res.status(400).json({ error: "invalid_billcode" });

    const order = await getOrderByCustomerAndBill(String(req.params.res), customerCode, billCode);
    if (!order) return res.status(404).json({ error: "not_found" });
    res.json({ data: { order } });
  } catch (e: any) {
    const msg = e.message === "resource_not_found" ? 404 : e.message.startsWith("invalid_") ? 400 : 500;
    res.status(msg).json({ error: e.message });
  }
});
