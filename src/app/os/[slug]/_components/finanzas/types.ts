export type AccountLite = {
  id: string;
  name: string;
  kind: string;
  currency: string;
  balance: number;
  active: boolean;
};

export const ACCOUNT_KIND_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  banco: "Banco",
  mp: "Mercado Pago",
  dolares: "Dólares",
  cheques: "Cheques",
  otro: "Otro",
};

export const METHOD_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  mp: "Mercado Pago",
  transferencia: "Transferencia",
};

export const MOV_KIND_LABELS: Record<string, string> = {
  venta: "Venta",
  gasto: "Gasto",
  ajuste: "Ajuste",
  transferencia: "Transferencia",
};
