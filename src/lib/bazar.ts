/**
 * Módulo Bazar (template "bazar" — tienda deco & home online).
 * Helpers PUROS compartidos entre web pública, admin y APIs.
 * Sin imports de server acá: esto lo pueden usar componentes client.
 */

/** Ítem del carrito / de BazarPedido.items. */
export type BazarItem = {
  productoId: string;
  nombre: string;
  precio: number; // ARS enteros (el vigente al momento de agregar)
  cant: number;
  foto: string | null;
};

export const PEDIDO_ESTADOS = [
  "NUEVO",
  "PAGADO",
  "PREPARANDO",
  "DESPACHADO",
  "ENTREGADO",
  "CANCELADO",
] as const;
export type PedidoEstado = (typeof PEDIDO_ESTADOS)[number];

export const PEDIDO_ESTADO_LABEL: Record<PedidoEstado, string> = {
  NUEVO: "Nuevo",
  PAGADO: "Pagado",
  PREPARANDO: "Preparando",
  DESPACHADO: "Despachado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

/** Estados que cuentan como "pagados" (el pedido ya generó plata). */
export const ESTADOS_PAGOS: PedidoEstado[] = ["PAGADO", "PREPARANDO", "DESPACHADO", "ENTREGADO"];

/** "$ 12.900" — plata en enteros ARS, formato es-AR. */
export function fmtPrecio(n: number): string {
  return `$ ${Math.round(n).toLocaleString("es-AR")}`;
}

/** Precio vigente de un producto (oferta si hay). */
export function precioVigente(p: { precio: number; precioOferta: number | null }): number {
  return p.precioOferta != null && p.precioOferta > 0 && p.precioOferta < p.precio
    ? p.precioOferta
    : p.precio;
}

/** Cuota simple para mostrar "3 cuotas de $ X". */
export function fmtCuota(precio: number, cuotas: number): string {
  return fmtPrecio(Math.round(precio / cuotas));
}

/** slug URL-safe desde un nombre ("Set de 3 bowls Terracota" → "set-de-3-bowls-terracota"). */
export function slugify(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// ── Cupones — NO acumulables: aplica el MAYOR ─────────────────────────────

export const CUPON_POPUP = "HOLA5"; // 5% primera visita (popup)
export const PCT_POPUP = 5;
export const PCT_CUENTA = 10; // 10% primera compra con cuenta

export type Descuento = {
  tipo: "CUENTA10" | "POPUP5" | null;
  monto: number; // ARS enteros
  motivo: string; // explicación en criollo de qué se aplicó y por qué
};

/**
 * Regla de descuentos del bazar: HOLA5 (5%) y 10% primera compra con cuenta
 * NO se acumulan — se aplica el mayor y se explica cuál y por qué.
 */
export function calcularDescuento(opts: {
  subtotal: number;
  cupon?: string | null; // código tipeado en el carrito
  cuentaConDescuento?: boolean; // logueado y todavía no usó el 10%
}): Descuento {
  const cuponOk = (opts.cupon ?? "").trim().toUpperCase() === CUPON_POPUP;
  const cuenta = Boolean(opts.cuentaConDescuento);

  if (cuenta) {
    const monto = Math.round((opts.subtotal * PCT_CUENTA) / 100);
    return {
      tipo: "CUENTA10",
      monto,
      motivo: cuponOk
        ? "Aplicamos el 10% de tu primera compra (mayor que el cupón HOLA5 — no se acumulan)."
        : "10% OFF por tu primera compra con cuenta.",
    };
  }
  if (cuponOk) {
    const monto = Math.round((opts.subtotal * PCT_POPUP) / 100);
    return { tipo: "POPUP5", monto, motivo: "5% OFF con el cupón HOLA5." };
  }
  return { tipo: null, monto: 0, motivo: "" };
}

/** ¿Producto nuevo? (menos de 14 días desde el alta). */
export function esNuevo(createdAt: string | Date): boolean {
  const t = typeof createdAt === "string" ? new Date(createdAt).getTime() : createdAt.getTime();
  return Date.now() - t < 14 * 86_400_000;
}

/** Primera foto del array Json de fotos (o null). */
export function primeraFoto(fotos: unknown): string | null {
  if (Array.isArray(fotos) && typeof fotos[0] === "string") return fotos[0];
  return null;
}

/** Normaliza el Json de fotos a string[]. */
export function fotosDe(fotos: unknown): string[] {
  return Array.isArray(fotos) ? fotos.filter((f): f is string => typeof f === "string") : [];
}

/** Normaliza el Json de items a BazarItem[]. */
export function itemsDe(items: unknown): BazarItem[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter((i): i is Record<string, unknown> => Boolean(i) && typeof i === "object")
    .map((i) => ({
      productoId: String(i.productoId ?? ""),
      nombre: String(i.nombre ?? ""),
      precio: Number(i.precio ?? 0),
      cant: Number(i.cant ?? 0),
      foto: typeof i.foto === "string" ? i.foto : null,
    }))
    .filter((i) => i.productoId && i.cant > 0);
}

/** Caption automático para publicar un producto en Instagram (editable). */
export function captionAuto(p: { nombre: string; precio: number; precioOferta: number | null }): string {
  return `${p.nombre} ✨\n${fmtPrecio(precioVigente(p))}\nEnvíos a todo el país 🐚 #decohome #montehermoso`;
}
