/** Views serializables de Finanzas que viajan del server a los client components. */

export type ChequeView = {
  id: string;
  tipo: string; // A_COBRAR | A_PAGAR
  beneficiario: string;
  monto: number;
  moneda: string;
  fechaVencimiento: string; // ISO
  fechaConcretado: string | null;
  formato: string;
  estado: string; // PENDIENTE | CONCRETADO | ANULADO
  observaciones: string | null;
};

export type CobroView = {
  id: string;
  sentido: string; // COBRAR | PAGAR
  cliente: string;
  tipo: string;
  descripcion: string | null;
  monto: number;
  moneda: string;
  fechaVencimiento: string | null; // ISO
  fechaCobro: string | null;
  estado: string; // PENDIENTE | COBRADO
  observaciones: string | null;
};

export type CostoView = {
  id: string;
  concepto: string;
  categoria: string;
  montoArs: number;
  notas: string | null;
  activo: boolean;
};

export const ACCOUNT_KIND_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  banco: "Banco",
  mp: "Mercado Pago",
  dolares: "Dólares",
  cheques: "Cheques",
  otro: "Otro",
};
