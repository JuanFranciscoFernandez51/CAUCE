/**
 * Lógica pura del módulo Finanzas (patrón Vespa Bahía, multi-tenant).
 *
 * Reglas de oro:
 * - Cash-basis: el resultado sale SOLO de movimientos concretados.
 * - Los saldos NUNCA se almacenan: siempre saldoInicial + Σ movimientos.
 *   (Account.balance queda como cache para otros módulos, pero acá se calcula.)
 * - Fechas de movimiento a MEDIODÍA -03:00 para no correrse de día.
 *
 * Mapeo de CashMovement.kind → tipo financiero:
 *   "venta" → INGRESO · "gasto" → GASTO · "transferencia" → TRANSFERENCIA
 *   "ajuste" (histórico) → ingreso o gasto según el signo del monto.
 */

import { argDateStr } from "./dates";

// ── Tipos livianos (serializables, van del server al client) ──
export type MovFin = {
  id: string;
  kind: string; // venta | gasto | ajuste | transferencia
  concept: string;
  amountArs: number; // patas de transferencia nueva: CON SIGNO
  categoria: string | null;
  moneda: string; // ARS | USD
  date: string; // ISO
  accountId: string | null;
  toAccountId: string | null; // solo transferencias viejas (1 fila)
  transferenciaId: string | null;
  method?: string | null;
  attachmentUrl?: string | null;
};

export type CuentaFin = {
  id: string;
  name: string;
  kind: string;
  currency: string; // ARS | USD
  saldoInicial: number;
  excluirDeResultado: boolean;
  orden: number;
  active: boolean;
};

export type CategoriaFin = {
  id: string;
  nombre: string;
  tipo: string; // INGRESO | GASTO
  orden: number;
  activa: boolean;
};

// ── Constantes ──
export const SIN_CATEGORIA = "Sin categoría";
export const CATEGORIA_TRANSFERENCIA = "Transferencia entre cuentas";

/** Categorías default que se siembran la primera vez que un tenant entra a Finanzas. */
export const DEFAULT_CATEGORIAS_INGRESO = [
  "Ventas",
  "Cobros de clientes",
  "Servicios",
  "Comisiones",
  "Intereses",
  "Otros ingresos",
] as const;

export const DEFAULT_CATEGORIAS_GASTO = [
  "Compra de mercadería",
  "Proveedores",
  "Alquiler",
  "Sueldos",
  "Impuestos",
  "Servicios",
  "Marketing",
  "Gastos bancarios",
  "Mantenimiento",
  "Otros gastos",
] as const;

/** Categoría que se auto-asigna al concretar cartera/cheques como movimiento. */
export const CATEGORIA_COBRO_AUTO = "Cobros de clientes";
export const CATEGORIA_PAGO_AUTO = "Otros gastos";

export const TIPOS_POR_COBRAR = [
  "Crédito",
  "Saldo de cliente",
  "Venta a plazo",
  "Servicio",
  "Otro",
] as const;

export const TIPOS_POR_PAGAR = [
  "Proveedor",
  "Compra de stock",
  "Impuestos",
  "Sueldos",
  "Préstamo / banco",
  "Otro",
] as const;

export const MESES_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
export const MESES_CORTOS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

// ── Fechas (calendario argentino) ──

/** "YYYY-MM-DD" → instante al mediodía -03:00 (fecha contable estable). */
export function noonArg(dateStr: string): Date {
  return new Date(`${dateStr.slice(0, 10)}T12:00:00-03:00`);
}

/** Mes 0-11 del instante, en calendario argentino. */
export function argMonthIdx(iso: string | Date): number {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return Number(argDateStr(d).slice(5, 7)) - 1;
}

/** Año del instante, en calendario argentino. */
export function argYearOf(iso: string | Date): number {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return Number(argDateStr(d).slice(0, 4));
}

// ── Efecto sobre saldos ──

type MovSaldo = Pick<MovFin, "kind" | "amountArs" | "accountId" | "toAccountId">;

/**
 * Efecto del movimiento sobre el saldo de la cuenta `accountId`:
 * venta +, gasto −, ajuste con signo, transferencia vieja (1 fila) sale de
 * accountId y entra a toAccountId, transferencia nueva (2 patas) ya viene con signo.
 */
export function deltaPara(m: MovSaldo, accountId: string): number {
  if (m.kind === "transferencia") {
    if (m.toAccountId) {
      if (m.accountId === accountId) return -m.amountArs;
      if (m.toAccountId === accountId) return m.amountArs;
      return 0;
    }
    return m.accountId === accountId ? m.amountArs : 0;
  }
  if (m.accountId !== accountId) return 0;
  if (m.kind === "venta") return m.amountArs;
  if (m.kind === "gasto") return -m.amountArs;
  return m.amountArs; // ajuste
}

/** Cuentas afectadas por un movimiento (para recalcular caches). */
export function cuentasAfectadas(m: MovSaldo): string[] {
  return [m.accountId, m.toAccountId].filter(Boolean) as string[];
}

// ── Resultado (ingresos/gastos) ──

/** Aporte del movimiento al resultado: {tipo, monto>0} o null (transferencias). */
export function resultadoDe(
  m: Pick<MovFin, "kind" | "amountArs">
): { tipo: "INGRESO" | "GASTO"; monto: number } | null {
  if (m.kind === "venta") return { tipo: "INGRESO", monto: m.amountArs };
  if (m.kind === "gasto") return { tipo: "GASTO", monto: m.amountArs };
  if (m.kind === "ajuste") {
    return m.amountArs >= 0
      ? { tipo: "INGRESO", monto: m.amountArs }
      : { tipo: "GASTO", monto: -m.amountArs };
  }
  return null; // transferencia: neutra
}

/** Categoría efectiva para mostrar/agrupar. */
export function categoriaDe(m: Pick<MovFin, "kind" | "categoria">): string {
  if (m.kind === "transferencia") return CATEGORIA_TRANSFERENCIA;
  return m.categoria || SIN_CATEGORIA;
}

// ── Saldos por cuenta ──

export type SaldoCuenta = {
  cuenta: CuentaFin;
  saldoInicial: number;
  movimientoNeto: number;
  saldoActual: number;
};

export function calcularSaldos(cuentas: CuentaFin[], movimientos: MovSaldo[]): SaldoCuenta[] {
  return cuentas.map((c) => {
    const movimientoNeto = movimientos.reduce((s, m) => s + deltaPara(m, c.id), 0);
    return {
      cuenta: c,
      saldoInicial: c.saldoInicial,
      movimientoNeto,
      saldoActual: c.saldoInicial + movimientoNeto,
    };
  });
}

// ── Helpers de resultado con exclusiones ──

function excluidasSet(cuentas: CuentaFin[]): Set<string> {
  return new Set(cuentas.filter((c) => c.excluirDeResultado).map((c) => c.id));
}

/** ¿El movimiento cuenta para el resultado? (excluye cuentas marcadas) */
function enResultado(m: MovFin, excluidas: Set<string>): boolean {
  return !(m.accountId && excluidas.has(m.accountId));
}

/**
 * Une las categorías configuradas (en orden) con las que aparezcan en los datos
 * y no estén configuradas (ej: "Sin categoría" o nombres viejos), para no
 * perder ningún movimiento en los resúmenes.
 */
function categoriasEfectivas(
  configuradas: readonly string[],
  movs: MovFin[],
  tipo: "INGRESO" | "GASTO",
  excluidas: Set<string>
): string[] {
  const set = new Set(configuradas);
  const extras: string[] = [];
  for (const m of movs) {
    const r = resultadoDe(m);
    if (!r || r.tipo !== tipo || !enResultado(m, excluidas)) continue;
    const cat = categoriaDe(m);
    if (!set.has(cat)) {
      set.add(cat);
      extras.push(cat);
    }
  }
  return [...configuradas, ...extras];
}

// ── Resumen mensual ──

export type LineaCategoria = { categoria: string; monto: number };

export type ResumenMensual = {
  mes: number; // 0-11
  anio: number;
  ingresos: LineaCategoria[];
  gastos: LineaCategoria[];
  totalIngresos: number;
  totalGastos: number;
  resultado: number;
  margen: number; // %
  ingresosUSD: number;
  gastosUSD: number;
  resultadoUSD: number;
  netoPorCuenta: { cuenta: string; neto: number }[];
};

export function calcularResumenMensual(
  movimientos: MovFin[],
  cuentas: CuentaFin[],
  mes: number,
  anio: number,
  catIngreso: readonly string[],
  catGasto: readonly string[]
): ResumenMensual {
  const excluidas = excluidasSet(cuentas);
  const delMes = movimientos.filter(
    (m) => argMonthIdx(m.date) === mes && argYearOf(m.date) === anio
  );

  const suma = (cat: string, tipo: "INGRESO" | "GASTO", moneda: string) =>
    delMes.reduce((a, m) => {
      const r = resultadoDe(m);
      if (!r || r.tipo !== tipo) return a;
      if (categoriaDe(m) !== cat || m.moneda !== moneda) return a;
      if (!enResultado(m, excluidas)) return a;
      return a + r.monto;
    }, 0);

  const ingresos = categoriasEfectivas(catIngreso, delMes, "INGRESO", excluidas).map((c) => ({
    categoria: c,
    monto: suma(c, "INGRESO", "ARS"),
  }));
  const gastos = categoriasEfectivas(catGasto, delMes, "GASTO", excluidas).map((c) => ({
    categoria: c,
    monto: suma(c, "GASTO", "ARS"),
  }));

  const totalIngresos = ingresos.reduce((a, l) => a + l.monto, 0);
  const totalGastos = gastos.reduce((a, l) => a + l.monto, 0);
  const resultado = totalIngresos - totalGastos;
  const margen = totalIngresos > 0 ? (resultado / totalIngresos) * 100 : 0;

  const sumaUSD = (tipo: "INGRESO" | "GASTO") =>
    delMes.reduce((a, m) => {
      const r = resultadoDe(m);
      if (!r || r.tipo !== tipo || m.moneda !== "USD") return a;
      if (!enResultado(m, excluidas)) return a;
      return a + r.monto;
    }, 0);
  const ingresosUSD = sumaUSD("INGRESO");
  const gastosUSD = sumaUSD("GASTO");

  const netoPorCuenta = cuentas
    .filter((c) => c.currency === "ARS")
    .map((c) => ({
      cuenta: c.name,
      neto: delMes.reduce((a, m) => a + deltaPara(m, c.id), 0),
    }));

  return {
    mes,
    anio,
    ingresos,
    gastos,
    totalIngresos,
    totalGastos,
    resultado,
    margen,
    ingresosUSD,
    gastosUSD,
    resultadoUSD: ingresosUSD - gastosUSD,
    netoPorCuenta,
  };
}

// ── Dashboard anual (matriz 12 meses) ──

export type FilaAnual = { categoria: string; meses: number[]; total: number };

export type DashboardAnual = {
  anio: number;
  ingresos: FilaAnual[];
  gastos: FilaAnual[];
  totalIngresosMes: number[];
  totalGastosMes: number[];
  resultadoMes: number[];
  resultadoAcumulado: number[];
  margenMes: number[];
  totalIngresosAnual: number;
  totalGastosAnual: number;
  resultadoAnual: number;
  ingresosUSDMes: number[];
  gastosUSDMes: number[];
  resultadoUSDMes: number[];
};

export function calcularDashboardAnual(
  movimientos: MovFin[],
  cuentas: CuentaFin[],
  anio: number,
  catIngreso: readonly string[],
  catGasto: readonly string[]
): DashboardAnual {
  const excluidas = excluidasSet(cuentas);
  const delAnio = movimientos.filter((m) => argYearOf(m.date) === anio);

  const filaPorCategoria = (cats: readonly string[], tipo: "INGRESO" | "GASTO"): FilaAnual[] =>
    categoriasEfectivas(cats, delAnio, tipo, excluidas).map((cat) => {
      const meses = Array.from({ length: 12 }, () => 0);
      for (const m of delAnio) {
        const r = resultadoDe(m);
        if (!r || r.tipo !== tipo || m.moneda !== "ARS") continue;
        if (categoriaDe(m) !== cat || !enResultado(m, excluidas)) continue;
        meses[argMonthIdx(m.date)] += r.monto;
      }
      return { categoria: cat, meses, total: meses.reduce((a, b) => a + b, 0) };
    });

  const ingresos = filaPorCategoria(catIngreso, "INGRESO");
  const gastos = filaPorCategoria(catGasto, "GASTO");

  const sumCols = (filas: FilaAnual[]) =>
    Array.from({ length: 12 }, (_, mi) => filas.reduce((a, f) => a + f.meses[mi], 0));

  const totalIngresosMes = sumCols(ingresos);
  const totalGastosMes = sumCols(gastos);
  const resultadoMes = totalIngresosMes.map((v, i) => v - totalGastosMes[i]);
  const margenMes = resultadoMes.map((r, i) =>
    totalIngresosMes[i] > 0 ? (r / totalIngresosMes[i]) * 100 : 0
  );

  let acc = 0;
  const resultadoAcumulado = resultadoMes.map((r) => (acc += r));

  const usdMes = (tipo: "INGRESO" | "GASTO") => {
    const arr = Array.from({ length: 12 }, () => 0);
    for (const m of delAnio) {
      const r = resultadoDe(m);
      if (!r || r.tipo !== tipo || m.moneda !== "USD") continue;
      if (!enResultado(m, excluidas)) continue;
      arr[argMonthIdx(m.date)] += r.monto;
    }
    return arr;
  };
  const ingresosUSDMes = usdMes("INGRESO");
  const gastosUSDMes = usdMes("GASTO");

  return {
    anio,
    ingresos,
    gastos,
    totalIngresosMes,
    totalGastosMes,
    resultadoMes,
    resultadoAcumulado,
    margenMes,
    totalIngresosAnual: totalIngresosMes.reduce((a, b) => a + b, 0),
    totalGastosAnual: totalGastosMes.reduce((a, b) => a + b, 0),
    resultadoAnual: resultadoMes.reduce((a, b) => a + b, 0),
    ingresosUSDMes,
    gastosUSDMes,
    resultadoUSDMes: ingresosUSDMes.map((v, i) => v - gastosUSDMes[i]),
  };
}

// ── Costos fijos ──

export type MetricasCostosFijos = {
  totalMensual: number;
  costoPorDia: number;
  costoPorUnidad: number;
  unidadesMinimas: number; // breakeven: ventas/mes para cubrir el costo fijo
  costoAnual: number;
};

export function calcularMetricasCostosFijos(
  costos: { montoArs: number; activo: boolean }[],
  config: { unidadesEstimadasMes: number; margenPorUnidad: number }
): MetricasCostosFijos {
  const totalMensual = costos.filter((c) => c.activo).reduce((a, c) => a + c.montoArs, 0);
  return {
    totalMensual,
    costoPorDia: totalMensual / 30,
    costoPorUnidad: config.unidadesEstimadasMes > 0 ? totalMensual / config.unidadesEstimadasMes : 0,
    unidadesMinimas: config.margenPorUnidad > 0 ? totalMensual / config.margenPorUnidad : 0,
    costoAnual: totalMensual * 12,
  };
}

/** Config del punto de equilibrio, guardada en Client.settings.finanzas. */
export type FinanzasConfig = {
  unidadesEstimadasMes: number;
  margenPorUnidad: number;
};

export function finanzasConfigDe(settings: unknown): FinanzasConfig {
  const s = (settings as { finanzas?: Partial<FinanzasConfig> } | null)?.finanzas;
  return {
    unidadesEstimadasMes:
      typeof s?.unidadesEstimadasMes === "number" ? s.unidadesEstimadasMes : 30,
    margenPorUnidad: typeof s?.margenPorUnidad === "number" ? s.margenPorUnidad : 0,
  };
}

// ── Formato ──

/** Monto abreviado para la matriz anual: 12.500 → "13k", 3.400.000 → "3.4M", 0 → "—". */
export function abrevMonto(n: number): string {
  if (n === 0) return "—";
  const abs = Math.abs(n);
  const s =
    abs >= 1_000_000
      ? `${(abs / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
      : abs >= 1000
        ? `${Math.round(abs / 1000)}k`
        : String(Math.round(abs));
  return n < 0 ? `-${s}` : s;
}
