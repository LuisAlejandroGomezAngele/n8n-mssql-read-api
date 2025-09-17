export type ResourceCfg = {
  view: string;
  pk?: string;
  allowSort?: string[];
  allowFilter?: string[];
};

export const RESOURCES: Record<string, ResourceCfg> = {
  productos: {
    view: "view_ProductsPricesRegions",
    pk: "productId",
    allowSort: ["productId", "CodigoProducto", "Especificacion"],
    allowFilter: ["productId", "CodigoProducto", "Especificacion", "Descripcion"],
  },
  inventories: {
    view: "vw_inventories",
    pk: "code",
    allowSort: ["code", "aviableQuantity"],
    allowFilter: ["code", "spec", "warehouseCategory", "warehouseCode"],
  },
  customers : {
    view: "getCustomers",
    pk: "customer_id",
    allowSort: ["customer_id", "customer_code"],
    allowFilter: ["customer_id", "customer_code"],
  },
  orders: {
    view: "vw_AllOrders_Bamboo",
    pk: "BillCode",
    allowSort: ["BillCode", "customerCode"],
    allowFilter: ["BillCode", "customerCode"],
  },

};