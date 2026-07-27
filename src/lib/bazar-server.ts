import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { BazarCuenta, BazarPedido, Client, Prisma, PrismaClient } from "@prisma/client";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { recalcularBalances } from "@/app/os/[slug]/_lib/finanzas-data";
import { ESTADOS_PAGOS, itemsDe, type PedidoEstado } from "@/lib/bazar";

/**
 * Lado server del módulo Bazar: tenant, sesión del comprador (JWT propio,
 * NADA que ver con el NextAuth del admin), MercadoPago y efectos de "pedido pagado".
 */

// ── Tenant ────────────────────────────────────────────────────────────────

export function esBazar(tenant: Client): boolean {
  return (tenant.settings as { template?: string } | null)?.template === "bazar";
}

/** Settings tipados que usa el sitio del bazar. */
export type BazarSettings = {
  instagram?: string;
  horarios?: string;
  fotos?: string[];
  sobre?: string;
  envioCosto?: number; // costo de envío a domicilio (ARS)
  datosNegocio?: { direccion?: string; telefono?: string };
};

export function bazarSettings(tenant: Client): BazarSettings {
  return (tenant.settings as BazarSettings | null) ?? {};
}

/** Categorías reales del catálogo del tenant (para header/filtros/chips). */
export async function bazarCategorias(clientId: string): Promise<string[]> {
  const rows = await db.bazarProducto.groupBy({
    by: ["categoria"],
    where: { clientId, activo: true },
    _count: { _all: true },
    orderBy: { _count: { categoria: "desc" } },
  });
  return rows.map((r) => r.categoria);
}

// ── Sesión del comprador (JWT HMAC-SHA256 en cookie httpOnly) ─────────────

function jwtSecret(): string {
  const s = process.env.NEXTAUTH_SECRET ?? process.env.ENCRYPTION_KEY;
  if (!s) throw new Error("Falta NEXTAUTH_SECRET para la sesión del sitio");
  return s;
}

const b64u = (buf: Buffer) => buf.toString("base64url");

/** Firma un token de sesión del sitio: header.payload.firma (30 días). */
export function firmarSesion(payload: { cuentaId: string; clientId: string }): string {
  const header = b64u(Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = b64u(
    Buffer.from(
      JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 30 * 86_400 })
    )
  );
  const firma = b64u(createHmac("sha256", jwtSecret()).update(`${header}.${body}`).digest());
  return `${header}.${body}.${firma}`;
}

export function verificarSesion(token: string): { cuentaId: string; clientId: string } | null {
  const partes = token.split(".");
  if (partes.length !== 3) return null;
  const [header, body, firma] = partes;
  try {
    const esperada = createHmac("sha256", jwtSecret()).update(`${header}.${body}`).digest();
    const recibida = Buffer.from(firma, "base64url");
    if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      cuentaId?: string;
      clientId?: string;
      exp?: number;
    };
    if (!payload.cuentaId || !payload.clientId) return null;
    if (!payload.exp || payload.exp * 1000 < Date.now()) return null;
    return { cuentaId: payload.cuentaId, clientId: payload.clientId };
  } catch {
    return null;
  }
}

export const cookieSesion = (slug: string) => `bz_sesion_${slug}`;

/** Cuenta logueada del sitio (o null). Lee la cookie y valida tenant + firma. */
export async function cuentaDeSesion(tenant: Client): Promise<BazarCuenta | null> {
  const jar = await cookies();
  const token = jar.get(cookieSesion(tenant.slug))?.value;
  if (!token) return null;
  const payload = verificarSesion(token);
  if (!payload || payload.clientId !== tenant.id) return null;
  return db.bazarCuenta.findFirst({ where: { id: payload.cuentaId, clientId: tenant.id } });
}

// ── MercadoPago (Checkout Pro por fetch, lazy, token por tenant) ──────────

/**
 * Access token de MP del tenant: env MP_ACCESS_TOKEN_<SLUG> o
 * Client.settings.secrets.mpAccessTokenEnc (cifrado con lib/crypto).
 */
export function mpToken(tenant: Client): string | null {
  const porEnv = process.env[`MP_ACCESS_TOKEN_${tenant.slug.toUpperCase().replace(/-/g, "_")}`];
  if (porEnv) return porEnv;
  const secrets = (tenant.settings as { secrets?: { mpAccessTokenEnc?: string } } | null)?.secrets;
  if (secrets?.mpAccessTokenEnc) {
    try {
      return decrypt(secrets.mpAccessTokenEnc);
    } catch {
      return null;
    }
  }
  return null;
}

export type PreferenciaMp = { id: string; initPoint: string };

/**
 * Crea la preference de Checkout Pro. Devuelve null si falla — GOTCHA CONOCIDA:
 * MP puede responder 403 VACÍO desde IPs de Vercel (pasó en Motos Fernández).
 * El caller SIEMPRE registra el pedido igual y ofrece coordinar por WhatsApp.
 */
export async function crearPreferenciaMp(opts: {
  tenant: Client;
  pedido: { id: string; numero: number; total: number; email?: string | null; nombre: string };
  baseUrl: string; // https:// completo (back_urls lo exigen)
}): Promise<PreferenciaMp | null> {
  const token = mpToken(opts.tenant);
  if (!token) return null;
  const backBase = `${opts.baseUrl}/sitio/${opts.tenant.slug}/carrito`;
  try {
    const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        items: [
          {
            id: opts.pedido.id,
            title: `Pedido #${opts.pedido.numero} — ${opts.tenant.name}`,
            quantity: 1,
            currency_id: "ARS",
            unit_price: opts.pedido.total,
          },
        ],
        payer: {
          name: opts.pedido.nombre,
          ...(opts.pedido.email ? { email: opts.pedido.email } : {}),
        },
        external_reference: opts.pedido.id,
        back_urls: {
          success: `${backBase}?pago=ok&pedido=${opts.pedido.numero}`,
          pending: `${backBase}?pago=pendiente&pedido=${opts.pedido.numero}`,
          failure: `${backBase}?pago=error&pedido=${opts.pedido.numero}`,
        },
        auto_return: "approved",
        notification_url: `${opts.baseUrl}/api/public/sitio/${opts.tenant.slug}/mp-webhook`,
        statement_descriptor: opts.tenant.name.slice(0, 22),
      }),
    });
    if (!res.ok) return null; // 403 vacío de Vercel u otro rechazo → flujo WhatsApp
    const data = (await res.json().catch(() => null)) as {
      id?: string;
      init_point?: string;
    } | null;
    if (!data?.id || !data.init_point) return null;
    return { id: data.id, initPoint: data.init_point };
  } catch {
    return null;
  }
}

/** Consulta un pago en MP (para el webhook). */
export async function consultarPagoMp(
  tenant: Client,
  paymentId: string
): Promise<{ status: string; externalReference: string | null } | null> {
  const token = mpToken(tenant);
  if (!token) return null;
  try {
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = (await res.json().catch(() => null)) as {
      status?: string;
      external_reference?: string;
    } | null;
    if (!data?.status) return null;
    return { status: data.status, externalReference: data.external_reference ?? null };
  } catch {
    return null;
  }
}

// ── Efectos de "pedido pagado" (webhook o marcado a mano en Despacho) ─────

type Tx = Prisma.TransactionClient | PrismaClient;

/**
 * Marca un pedido como PAGADO con TODOS sus efectos, una sola vez (idempotente):
 * descuenta stock, suma `vendidos`, quema el 10% de la cuenta si correspondía
 * y crea el CashMovement de ingreso en Finanzas (cuenta MercadoPago/Efectivo,
 * categoría "Ventas tienda").
 */
export async function marcarPedidoPagado(opts: {
  clientId: string;
  pedidoId: string;
  mpPaymentId?: string | null;
  /** "mp" (default) o "efectivo" — a qué cuenta de Finanzas entra la plata. */
  medio?: "mp" | "efectivo";
}): Promise<BazarPedido | null> {
  return db.$transaction(async (tx) => {
    const pedido = await tx.bazarPedido.findFirst({
      where: { id: opts.pedidoId, clientId: opts.clientId },
    });
    if (!pedido) return null;
    // Idempotencia: si ya está pagado (o más adelante), no repetimos efectos.
    if (ESTADOS_PAGOS.includes(pedido.estado as PedidoEstado)) return pedido;

    const actualizado = await tx.bazarPedido.update({
      where: { id: pedido.id },
      data: {
        estado: "PAGADO",
        ...(opts.mpPaymentId ? { mpPaymentId: opts.mpPaymentId } : {}),
      },
    });

    for (const item of itemsDe(pedido.items)) {
      await tx.bazarProducto.updateMany({
        where: { id: item.productoId, clientId: opts.clientId },
        data: { stock: { decrement: item.cant }, vendidos: { increment: item.cant } },
      });
    }
    // Stock nunca negativo (si vendió de más, queda en 0).
    await tx.bazarProducto.updateMany({
      where: { clientId: opts.clientId, stock: { lt: 0 } },
      data: { stock: 0 },
    });

    if (pedido.descuentoTipo === "CUENTA10" && pedido.cuentaId) {
      await tx.bazarCuenta.updateMany({
        where: { id: pedido.cuentaId, clientId: opts.clientId },
        data: { usoDescuento: true },
      });
    }

    await registrarIngresoPedido(tx, opts.clientId, actualizado, opts.medio ?? "mp");
    return actualizado;
  });
}

/**
 * Conexión pedidos→Finanzas: ingreso automático en la cuenta que corresponda
 * (MercadoPago o Efectivo local), categoría "Ventas tienda".
 */
async function registrarIngresoPedido(
  tx: Tx,
  clientId: string,
  pedido: BazarPedido,
  medio: "mp" | "efectivo"
): Promise<void> {
  const cuenta =
    (await tx.account.findFirst({
      where: { clientId, active: true, kind: medio === "mp" ? "mp" : "efectivo" },
      orderBy: { orden: "asc" },
    })) ??
    (await tx.account.findFirst({ where: { clientId, active: true }, orderBy: { orden: "asc" } }));
  if (!cuenta) return; // tenant sin Finanzas configuradas: no rompemos el pago

  await tx.cashMovement.create({
    data: {
      clientId,
      kind: "venta",
      concept: `Pedido #${pedido.numero} — ${pedido.nombre}`,
      categoria: "Ventas tienda",
      amountArs: pedido.total,
      moneda: cuenta.currency,
      method: medio === "mp" ? "mp" : "efectivo",
      accountId: cuenta.id,
      date: new Date(),
    },
  });
  await recalcularBalances(tx, clientId, [cuenta.id]);
}

/** Slug único por tenant para un producto: "bowl-terracota", "bowl-terracota-2"… */
export async function slugUnicoProducto(
  tx: Tx,
  clientId: string,
  nombre: string,
  ignorarId?: string
): Promise<string> {
  const { slugify } = await import("@/lib/bazar");
  const baseSlug = slugify(nombre) || "producto";
  let candidato = baseSlug;
  for (let n = 2; n < 1000; n++) {
    const existe = await tx.bazarProducto.findFirst({
      where: { clientId, slug: candidato, ...(ignorarId ? { id: { not: ignorarId } } : {}) },
      select: { id: true },
    });
    if (!existe) return candidato;
    candidato = `${baseSlug}-${n}`;
  }
  return `${baseSlug}-${Date.now()}`;
}

/** Próximo número de pedido del tenant (secuencial simple). */
export async function proximoNumeroPedido(tx: Tx, clientId: string): Promise<number> {
  const ultimo = await tx.bazarPedido.findFirst({
    where: { clientId },
    orderBy: { numero: "desc" },
    select: { numero: true },
  });
  return (ultimo?.numero ?? 0) + 1;
}
