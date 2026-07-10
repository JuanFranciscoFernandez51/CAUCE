/** Un pago registrado en la venta. */
export type PagoVenta = { fecha: string; montoArs: number; medio: string };

/** Saldo vivo de la venta = precio − seña − permuta − pagos. */
export function saldoDeVenta(
  precioArs: number,
  senaArs: number,
  permutaValorArs: number,
  pagos: PagoVenta[] | null
): number {
  const pagado = (pagos ?? []).reduce((s, p) => s + (p.montoArs || 0), 0);
  return Math.round((precioArs - senaArs - permutaValorArs - pagado) * 100) / 100;
}
