/**
 * Financiaciones propias de la concesionaria y ficha de proveedores.
 * Sin imports de Prisma ni de la DB: lo usan tanto el server como los
 * componentes "use client" (botones de copiar, avisos por WhatsApp).
 */

// ── Proveedores: las tres tablas que viven en Json ────────────────────────

export type ContactoProveedor = {
  id: string;
  nombre: string;
  rol: string;
  telefono: string;
  email: string;
};

export type CuentaBancaria = {
  id: string;
  banco: string;
  tipo: string; // Caja de ahorro | Cuenta corriente | Billetera
  numero: string;
  cbu: string;
  alias: string;
  titular: string;
  moneda: string; // ARS | USD
};

export type FilaPrecio = {
  id: string;
  concepto: string;
  precio: number | null;
  moneda: string;
  notas: string;
};

export const ROLES_CONTACTO = [
  "Administración",
  "Vendedor",
  "Posventa",
  "Repuestos",
  "Gerencia",
  "Otro",
] as const;

export const TIPOS_CUENTA = [
  "Caja de ahorro",
  "Cuenta corriente",
  "Billetera virtual",
] as const;

/** id corto y estable para las filas de las tablas Json. */
export function filaId(): string {
  return `f${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function comoFilas(json: unknown): Record<string, unknown>[] {
  if (!Array.isArray(json)) return [];
  return json.filter((f): f is Record<string, unknown> => !!f && typeof f === "object");
}

const txt = (v: unknown): string => (typeof v === "string" ? v : v == null ? "" : String(v));

export function contactosDe(json: unknown): ContactoProveedor[] {
  return comoFilas(json).map((f) => ({
    id: txt(f.id) || filaId(),
    nombre: txt(f.nombre),
    rol: txt(f.rol) || "Administración",
    telefono: txt(f.telefono),
    email: txt(f.email),
  }));
}

export function cuentasDe(json: unknown): CuentaBancaria[] {
  return comoFilas(json).map((f) => ({
    id: txt(f.id) || filaId(),
    banco: txt(f.banco),
    tipo: txt(f.tipo) || "Cuenta corriente",
    numero: txt(f.numero),
    cbu: txt(f.cbu),
    alias: txt(f.alias),
    titular: txt(f.titular),
    moneda: txt(f.moneda) === "USD" ? "USD" : "ARS",
  }));
}

export function preciosDe(json: unknown): FilaPrecio[] {
  return comoFilas(json).map((f) => ({
    id: txt(f.id) || filaId(),
    concepto: txt(f.concepto),
    precio: f.precio == null || f.precio === "" ? null : Number(f.precio),
    moneda: txt(f.moneda) === "USD" ? "USD" : "ARS",
    notas: txt(f.notas),
  }));
}

export const CONTACTO_VACIO = (): ContactoProveedor => ({
  id: filaId(),
  nombre: "",
  rol: "Administración",
  telefono: "",
  email: "",
});

export const CUENTA_VACIA = (): CuentaBancaria => ({
  id: filaId(),
  banco: "",
  tipo: "Cuenta corriente",
  numero: "",
  cbu: "",
  alias: "",
  titular: "",
  moneda: "ARS",
});

export const PRECIO_VACIO = (): FilaPrecio => ({
  id: filaId(),
  concepto: "",
  precio: null,
  moneda: "ARS",
  notas: "",
});

// ── Financiaciones ────────────────────────────────────────────────────────

export const FINANCIACION_ESTADOS = ["ACTIVA", "COMPLETADA", "CANCELADA"] as const;

export const FINANCIACION_ESTADO_LABEL: Record<string, string> = {
  ACTIVA: "Activa",
  COMPLETADA: "Terminada",
  CANCELADA: "Cancelada",
};

export const CUOTA_ESTADO_LABEL: Record<string, string> = {
  PENDIENTE: "Pendiente",
  PAGADA: "Pagada",
  VENCIDA: "Vencida",
};

export const METODOS_PAGO = ["efectivo", "transferencia", "tarjeta", "cheque"] as const;

/** FIN-0007 */
export function numeroFinanciacion(numero: number): string {
  return `FIN-${String(numero).padStart(4, "0")}`;
}

/** "$ 1.250.000" / "US$ 12.500" */
export function fmtPlata(monto: number | null | undefined, moneda: string): string {
  const n = Math.round(Number(monto) || 0).toLocaleString("es-AR");
  return moneda === "USD" ? `US$ ${n}` : `$ ${n}`;
}

/** Teléfono argentino → número de wa.me (mismo criterio que Ventas y Taller). */
export function waNumber(tel: string): string {
  let d = tel.replace(/\D/g, "");
  if (d.startsWith("0")) d = d.slice(1);
  if (!d.startsWith("54")) d = `54${d}`;
  if (!d.startsWith("549")) d = `549${d.slice(2)}`;
  return d;
}

export function waLink(tel: string, mensaje: string): string {
  return `https://wa.me/${waNumber(tel)}?text=${encodeURIComponent(mensaje)}`;
}

/** Fecha corta en hora Argentina: 09/08/2026 */
export function fmtFecha(d: Date | string): string {
  const f = typeof d === "string" ? new Date(d) : d;
  return f.toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" });
}

/** YYYY-MM-DD en hora Argentina (para inputs date). */
export function aFechaInput(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** Hoy a las 12 del mediodía hora Argentina (evita el corrimiento UTC-3). */
export function hoyAr(): Date {
  return new Date(`${aFechaInput(new Date())}T12:00:00-03:00`);
}

/** Días que faltan (negativo = ya venció). */
export function diasHasta(fecha: Date): number {
  const hoy = hoyAr().getTime();
  const venc = new Date(`${aFechaInput(fecha)}T12:00:00-03:00`).getTime();
  return Math.round((venc - hoy) / 86_400_000);
}

export type CuotaCalculada = { numero: number; monto: number; fechaVencimiento: Date };

/**
 * Arma el plan de cuotas: la cuota N vence el día `diaVencimiento` del mes
 * N-ésimo posterior al inicio. La última absorbe el redondeo para que la suma
 * dé EXACTO el monto financiado.
 */
export function planDeCuotas(opts: {
  montoTotal: number;
  cantidadCuotas: number;
  valorCuota?: number | null;
  fechaInicio: Date;
  diaVencimiento: number;
}): CuotaCalculada[] {
  const cant = Math.max(1, Math.min(120, Math.round(opts.cantidadCuotas)));
  const total = Math.max(0, Number(opts.montoTotal) || 0);
  const base =
    opts.valorCuota && opts.valorCuota > 0
      ? Math.round(opts.valorCuota)
      : Math.round(total / cant);
  const dia = Math.max(1, Math.min(28, Math.round(opts.diaVencimiento || 10)));

  const inicio = opts.fechaInicio;
  const cuotas: CuotaCalculada[] = [];
  for (let i = 1; i <= cant; i++) {
    const f = new Date(inicio.getTime());
    f.setUTCDate(15); // ancla segura antes de mover el mes
    f.setUTCMonth(f.getUTCMonth() + i);
    const iso = `${f.getUTCFullYear()}-${String(f.getUTCMonth() + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    cuotas.push({
      numero: i,
      monto: base,
      fechaVencimiento: new Date(`${iso}T12:00:00-03:00`),
    });
  }
  // La última cierra la diferencia contra el total financiado.
  if (!opts.valorCuota || opts.valorCuota <= 0) {
    const suma = base * cant;
    const ultima = cuotas[cuotas.length - 1]!;
    ultima.monto = Math.max(0, ultima.monto + (total - suma));
  }
  return cuotas;
}

/** Estado real de una cuota mirando lo pagado y la fecha (no toca la DB). */
export function estadoCuota(c: {
  monto: number;
  montoPagado: number;
  fechaVencimiento: Date;
  estado: string;
}): "PENDIENTE" | "PAGADA" | "VENCIDA" {
  if (c.montoPagado >= c.monto - 0.5) return "PAGADA";
  if (c.estado === "CANCELADA") return "PENDIENTE";
  return diasHasta(c.fechaVencimiento) < 0 ? "VENCIDA" : "PENDIENTE";
}

/** Mensaje de WhatsApp del aviso de vencimiento, listo para mandar. */
export function mensajeAvisoCuota(opts: {
  nombre: string;
  numeroCuota: number;
  cantidadCuotas?: number;
  vehiculo?: string | null;
  fechaVencimiento: Date;
  saldo: number;
  moneda: string;
  negocio?: string;
}): string {
  const dias = diasHasta(opts.fechaVencimiento);
  const nombre = (opts.nombre || "").split(" ")[0] || opts.nombre;
  const deQue = opts.vehiculo ? `tu ${opts.vehiculo}` : "tu financiación";
  const cuota = opts.cantidadCuotas
    ? `la cuota ${opts.numeroCuota}/${opts.cantidadCuotas}`
    : `la cuota ${opts.numeroCuota}`;
  const plata = fmtPlata(opts.saldo, opts.moneda);
  const firma = opts.negocio ? `\n\n${opts.negocio}` : "";

  if (dias < 0) {
    return `Hola ${nombre}, ¿cómo va? Te recordamos que ${cuota} de ${deQue} venció el ${fmtFecha(
      opts.fechaVencimiento
    )} y quedan ${plata}. Cualquier cosa avisanos y lo vemos. ¡Gracias!${firma}`;
  }
  const cuando =
    dias === 0
      ? "vence HOY"
      : dias === 1
        ? "vence mañana"
        : `vence el ${fmtFecha(opts.fechaVencimiento)}`;
  return `Hola ${nombre}, ¿cómo va? Te recordamos que ${cuota} de ${deQue} ${cuando} — ${plata}. ¡Gracias!${firma}`;
}
