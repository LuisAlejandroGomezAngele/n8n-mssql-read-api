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
    allowFilter: ["productId", "CodigoProducto", "Especificacion"],
  },
  inventories: {
    view: "vw_inventories",
    pk: "code",
    allowSort: ["code", "aviableQuantity"],
    allowFilter: ["code", "spec", "warehouseCategory", "warehouseCode"],
  },
};
