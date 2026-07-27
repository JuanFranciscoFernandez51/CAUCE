import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { getTenantBySlug, hasModule } from "@/lib/tenant";
import {
  bazarSettings,
  crearPreferenciaMp,
  cuentaDeSesion,
  esBazar,
  proximoNumeroPedido,
} from "@/lib/bazar-server";
import { calcularDescuento, precioVigente, type BazarItem } from "@/lib/bazar";

/**
 * Checkout del bazar. El server es la VERDAD: revalida productos, precios y
 * stock contra la DB y recalcula el descuento (HOLA5 vs 10% cuenta, no
 * acumulables — aplica el mayor).
 *
 * ⚠️ GOTCHA MP: puede devolver 403 vacío desde IPs de Vercel (pasó en Motos
 * Fernández). Si la preference falla, el pedido queda registrado IGUAL
 * (estado NUEVO) y el front ofrece coordinar el pago por WhatsApp.
 */
const schema = z.object({
  items: z
    .array(z.object({ productoId: z.string().trim().min(1).max(60), cant: z.number().int().min(1).max(99) }))
    .min(1, "El carrito está vacío")
    .max(60),
  cupon: z.string().trim().max(30).nullable().optional(),
  retiroEnLocal: z.boolean(),
  nombre: z.string().trim().min(1, "Decinos tu nombre").max(200),
  telefono: z.string().trim().min(6, "El teléfono no parece válido").max(50),
  email: z.union([z.literal(""), z.email("Email inválido")]).optional().default(""),
  direccion: z.string().trim().max(300).optional().default(""),
  ciudad: z.string().trim().max(120).optional().default(""),
  cp: z.string().trim().max(20).optional().default(""),
  notas: z.string().trim().max(1000).optional().default(""),
});

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (!rateLimit(`bz-checkout:${slug}:${clientIp(req)}`, 6, 60_000)) {
    return NextResponse.json(
      { error: "Demasiados intentos. Esperá un minuto y probá de nuevo." },
      { status: 429 }
    );
  }

  const tenant = await getTenantBySlug(slug);
  if (!tenant || !hasModule(tenant, "sitio") || !esBazar(tenant)) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const d = parsed.data;
  if (!d.retiroEnLocal && !d.direccion) {
    return NextResponse.json(
      { error: "Necesitamos la dirección para el envío" },
      { status: 400 }
    );
  }

  // ── Revalidación server-side de productos, precios y stock ──
  const ids = [...new Set(d.items.map((i) => i.productoId))];
  const productos = await db.bazarProducto.findMany({
    where: { id: { in: ids }, clientId: tenant.id, activo: true },
  });
  const porId = new Map(productos.map((p) => [p.id, p]));

  const items: BazarItem[] = [];
  for (const pedido of d.items) {
    const p = porId.get(pedido.productoId);
    if (!p) {
      return NextResponse.json(
        { error: "Un producto del carrito ya no está disponible. Actualizá la página." },
        { status: 409 }
      );
    }
    if (p.stock < pedido.cant) {
      return NextResponse.json(
        {
          error:
            p.stock <= 0
              ? `"${p.nombre}" se quedó sin stock.`
              : `De "${p.nombre}" quedan solo ${p.stock} unidad${p.stock === 1 ? "" : "es"}.`,
        },
        { status: 409 }
      );
    }
    const fotos = Array.isArray(p.fotos) ? p.fotos : [];
    items.push({
      productoId: p.id,
      nombre: p.nombre,
      precio: precioVigente(p),
      cant: pedido.cant,
      foto: typeof fotos[0] === "string" ? fotos[0] : null,
    });
  }

  const subtotal = items.reduce((s, i) => s + i.precio * i.cant, 0);

  // ── Descuento (server manda): cuenta logueada sin usoDescuento > HOLA5 ──
  const cuenta = await cuentaDeSesion(tenant);
  const descuento = calcularDescuento({
    subtotal,
    cupon: d.cupon,
    cuentaConDescuento: Boolean(cuenta && !cuenta.usoDescuento),
  });

  const envio = d.retiroEnLocal ? 0 : Math.max(0, bazarSettings(tenant).envioCosto ?? 0);
  const total = subtotal - descuento.monto + envio;

  // ── Pedido (numero secuencial por tenant) ──
  const pedido = await db.$transaction(async (tx) => {
    const numero = await proximoNumeroPedido(tx, tenant.id);
    return tx.bazarPedido.create({
      data: {
        clientId: tenant.id,
        numero,
        items: JSON.parse(JSON.stringify(items)),
        subtotal,
        descuentoTipo: descuento.tipo,
        descuentoMonto: descuento.monto,
        envio,
        total,
        estado: "NUEVO",
        nombre: d.nombre,
        telefono: d.telefono,
        email: d.email || null,
        direccion: d.retiroEnLocal ? null : d.direccion || null,
        ciudad: d.retiroEnLocal ? null : d.ciudad || null,
        cp: d.retiroEnLocal ? null : d.cp || null,
        notas: d.notas || null,
        retiroEnLocal: d.retiroEnLocal,
        cuentaId: cuenta?.id ?? null,
      },
    });
  });

  // ── Lead en el CRM (todo comprador entra al CRM) ──
  try {
    const existente = await db.contact.findFirst({
      where: { clientId: tenant.id, phone: d.telefono },
    });
    const nota = `Pedido #${pedido.numero} — ${items.length} ítem(s), total $${total.toLocaleString("es-AR")}`;
    if (existente) {
      await db.contact.update({
        where: { id: existente.id },
        data: {
          lastTouchAt: new Date(),
          email: existente.email || d.email || null,
          notes: existente.notes ? `${existente.notes}\n${nota}` : nota,
        },
      });
    } else {
      await db.contact.create({
        data: {
          clientId: tenant.id,
          name: d.nombre,
          phone: d.telefono,
          email: d.email || null,
          source: "tienda web",
          stage: "cliente",
          notes: nota,
          lastTouchAt: new Date(),
        },
      });
    }
  } catch {
    // el CRM nunca frena una venta
  }

  // ── MercadoPago (best-effort, con la gotcha 403 manejada) ──
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  const baseUrl = host ? `${proto}://${host}` : new URL(req.url).origin;

  const pref = await crearPreferenciaMp({
    tenant,
    pedido: {
      id: pedido.id,
      numero: pedido.numero,
      total,
      email: d.email || null,
      nombre: d.nombre,
    },
    baseUrl,
  });

  if (pref) {
    await db.bazarPedido.update({
      where: { id: pedido.id },
      data: { mpPreferenceId: pref.id },
    });
  }

  return NextResponse.json(
    {
      ok: true,
      numero: pedido.numero,
      total,
      initPoint: pref?.initPoint ?? null,
    },
    { status: 201 }
  );
}
