/** Formato de plata en es-AR — compartido entre Catálogo y Caja. */

export function fmtArs(n: number): string {
  return n.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function fmtUsd(n: number): string {
  return n.toLocaleString("es-AR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/** Formatea según la moneda del dato ("ARS" | "USD"). */
export function fmtMoneda(n: number, moneda: string): string {
  return moneda === "USD" ? fmtUsd(n) : fmtArs(n);
}
