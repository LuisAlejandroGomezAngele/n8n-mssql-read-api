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
};
