import type { Client, ConceOperacion, Prisma, PrismaClient } from "@prisma/client";
import { db } from "@/lib/db";
import { recalcularBalances } from "@/app/os/[slug]/_lib/finanzas-data";
import { nombreVehiculo, numeroOperacion, permutasDe, type Permuta } from "@/lib/conce";
import { registrarActividad } from "@/lib/actividad";

/**
 * Lado server del template CONCESIONARIA: tenant, settings tipados y efectos
 * de "operación concretada" (boleto → ingreso en Finanzas + vehículo vendido).
 */

// ── Tenant ────────────────────────────────────────────────────────────────

export function esConcesionaria(tenant: Client): boolean {
  return (tenant.settings as { template?: string } | null)?.template === "concesionaria";
}

/** Templates con carpeta de proveedores (compras, CBU, listas de precios). */
export function tieneProveedores(tenant: Client): boolean {
  const tpl = (tenant.settings as { template?: string } | null)?.template;
  return tpl === "concesionaria" || tpl === "repuestos" || tpl === "eventos";
}

export type ConceSucursal = { direccion: string; maps?: string; whatsapp?: string };

/** Settings tipados que usa el sitio de la concesionaria. */
export type ConceSettings = {
  eslogan?: string;
  claim?: string;
  instagram?: string;
  facebook?: string;
  mercadolibre?: string;
  horarios?: string;
  razonSocial?: string;
  cuit?: string;
  sucursales?: ConceSucursal[];
  whatsapps?: string[]; // solo dígitos con 549...
  nosotros?: {
    historia?: string;
    numeros?: { valor: string; label: string }[];
    valores?: (string | { nombre: string; texto?: string })[];
  };
  serviciosFooter?: string[];
  logoOscuro?: string; // logo para fondo negro (header/footer)
};

export function conceSettings(tenant: Client): ConceSettings {
  return (tenant.settings as ConceSettings | null) ?? {};
}

// ── Slug único por tenant ─────────────────────────────────────────────────

type Tx = Prisma.TransactionClient | PrismaClient;

export async function slugUnicoVehiculo(
  tx: Tx,
  clientId: string,
  base: string,
  ignorarId?: string
): Promise<string> {
  const { slugify } = await import("@/lib/bazar");
  const baseSlug = slugify(base) || "vehiculo";
  let candidato = baseSlug;
  for (let n = 2; n < 1000; n++) {
    const existe = await tx.conceVehiculo.findFirst({
      where: { clientId, slug: candidato, ...(ignorarId ? { id: { not: ignorarId } } : {}) },
      select: { id: true },
    });
    if (!existe) return candidato;
    candidato = `${baseSlug}-${n}`;
  }
  return `${baseSlug}-${Date.now()}`;
}

/** Próximo número de mandato/boleto del tenant (secuencial por tipo). */
export async function proximoNumeroOperacion(
  tx: Tx,
  clientId: string,
  tipo: string
): Promise<number> {
  const ultimo = await tx.conceOperacion.findFirst({
    where: { clientId, tipo },
    orderBy: { numero: "desc" },
    select: { numero: true },
  });
  return (ultimo?.numero ?? 0) + 1;
}

// ── Cliente único (CRM) ───────────────────────────────────────────────────

/** custom:Json de un Contact → Record<string,string> (mismo criterio que el CRM). */
function customDeContacto(custom: unknown): Record<string, string> {
  if (!custom || typeof custom !== "object" || Array.isArray(custom)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(custom as Record<string, unknown>)) {
    if (v === null || v === undefined) continue;
    out[k] = String(v);
  }
  return out;
}

/**
 * Busca o crea el Contact (cliente del CRM) de la persona de una operación.
 * Regla de oro de Cauce: TODO cliente entra al CRM único.
 *
 * - Si el vendedor lo eligió del buscador viene `contactId`: ese manda.
 * - Si no, matchea por teléfono → email → nombre, así no duplica al mismo señor.
 *
 * El DNI/CUIT y el domicilio viven en `Contact.custom` (mismo criterio que la
 * carpeta de clientes). Completamos huecos SIN pisar lo que ya esté cargado.
 */
export async function vincularContacto(
  tx: Tx,
  clientId: string,
  datos: {
    nombre: string;
    telefono?: string | null;
    email?: string | null;
    dni?: string | null;
    domicilio?: string | null;
    contactId?: string | null;
  }
): Promise<string | null> {
  const nombre = datos.nombre?.trim();
  if (!nombre) return null;
  const telefono = datos.telefono?.trim() || null;
  const email = datos.email?.trim() || null;
  const dni = datos.dni?.trim() || null;
  const domicilio = datos.domicilio?.trim() || null;

  const elegido = datos.contactId?.trim()
    ? await tx.contact.findFirst({
        where: { id: datos.contactId.trim(), clientId },
        select: { id: true, custom: true },
      })
    : null;

  const existente =
    elegido ??
    (telefono
      ? await tx.contact.findFirst({
          where: { clientId, phone: telefono },
          select: { id: true, custom: true },
        })
      : null) ??
    (email
      ? await tx.contact.findFirst({
          where: { clientId, email: { equals: email, mode: "insensitive" } },
          select: { id: true, custom: true },
        })
      : null) ??
    (await tx.contact.findFirst({
      where: { clientId, name: { equals: nombre, mode: "insensitive" } },
      select: { id: true, custom: true },
    }));

  if (existente) {
    // Completamos huecos sin pisar lo que ya haya cargado el vendedor.
    const custom = customDeContacto(existente.custom);
    const customNuevo = { ...custom };
    if (dni && !custom.dni) customNuevo.dni = dni;
    if (domicilio && !custom.domicilio) customNuevo.domicilio = domicilio;
    const cambioCustom = Object.keys(customNuevo).length !== Object.keys(custom).length;

    await tx.contact.update({
      where: { id: existente.id },
      data: {
        ...(telefono ? { phone: telefono } : {}),
        ...(email ? { email } : {}),
        ...(cambioCustom ? { custom: customNuevo } : {}),
        lastTouchAt: new Date(),
      },
    });
    return existente.id;
  }

  const creado = await tx.contact.create({
    data: {
      clientId,
      name: nombre,
      phone: telefono,
      email,
      source: "operacion",
      stage: "cliente",
      custom: {
        ...(dni ? { dni } : {}),
        ...(domicilio ? { domicilio } : {}),
      },
      lastTouchAt: new Date(),
    },
    select: { id: true },
  });
  return creado.id;
}

// ── Alta automática al stock (mandato firmado / permuta tomada) ───────────

/** Crea un vehículo en el stock SIN PUBLICAR, con rastro de por dónde entró. */
async function crearVehiculoAutomatico(
  tx: Tx,
  clientId: string,
  datos: {
    marca: string;
    modelo: string;
    anio: number;
    km?: number;
    precio?: number | null;
    moneda?: string;
    dominio?: string | null;
    descripcion?: string | null;
    origenTipo: "MANDATO" | "PERMUTA";
    origenOperacionId: string;
  }
): Promise<string> {
  const anio = Number.isFinite(datos.anio) ? datos.anio : new Date().getFullYear();
  const v = await tx.conceVehiculo.create({
    data: {
      clientId,
      slug: await slugUnicoVehiculo(
        tx,
        clientId,
        `${datos.marca} ${datos.modelo} ${anio} en bahia blanca`
      ),
      marca: datos.marca,
      modelo: datos.modelo,
      anio,
      km: datos.km && datos.km > 0 ? Math.round(datos.km) : 0,
      precio: datos.precio && datos.precio > 0 ? datos.precio : null,
      moneda: datos.moneda === "USD" ? "USD" : "ARS",
      condicion: "usado",
      dominio: datos.dominio || null,
      descripcion: datos.descripcion || null,
      estado: "disponible",
      publicado: false, // entra al stock pero NO sale a la web hasta que lo revisen
      origenTipo: datos.origenTipo,
      origenOperacionId: datos.origenOperacionId,
    },
    select: { id: true },
  });
  return v.id;
}

/**
 * Da de alta en el stock las permutas cargadas en un boleto (idempotente:
 * cada permuta guarda el vehiculoId que generó).
 */
async function sincronizarPermutas(
  tx: Tx,
  clientId: string,
  op: ConceOperacion
): Promise<{ creados: number; permutas: Permuta[] }> {
  const permutas = permutasDe(op.permutas);
  if (permutas.length === 0) return { creados: 0, permutas };

  let creados = 0;
  const salida: Permuta[] = [];
  for (const p of permutas) {
    if (p.vehiculoId || !p.marca?.trim()) {
      salida.push(p);
      continue;
    }
    const vehiculoId = await crearVehiculoAutomatico(tx, clientId, {
      marca: p.marca.trim(),
      modelo: (p.modelo ?? "").trim() || "—",
      anio: Number(p.anio) || new Date().getFullYear(),
      km: Number(p.km) || 0,
      precio: null, // lo tasan ellos: el valor tomado NO es el precio de venta
      moneda: op.moneda,
      dominio: p.dominio ?? null,
      descripcion: `Tomado en permuta en el boleto ${numeroOperacion(op.tipo, op.numero)} por $ ${Math.round(
        Number(p.valorTomado) || 0
      ).toLocaleString("es-AR")}.`,
      origenTipo: "PERMUTA",
      origenOperacionId: op.id,
    });
    salida.push({ ...p, vehiculoId });
    creados++;
  }

  if (creados > 0) {
    await tx.conceOperacion.update({
      where: { id: op.id },
      data: { permutas: salida as unknown as Prisma.InputJsonValue },
    });
  }
  return { creados, permutas: salida };
}

/**
 * MANDATO FIRMADO → el vehículo entra SOLO al stock, sin publicar, vinculado
 * al mandato. Idempotente: si el mandato ya tiene vehículo, no duplica.
 * En un BOLETO firmado sincroniza las permutas tomadas.
 */
export async function firmarOperacion(opts: {
  clientId: string;
  operacionId: string;
}): Promise<{ vehiculoCreado: boolean; permutasCreadas: number }> {
  const resultado = await db.$transaction(async (tx) => {
    const op = await tx.conceOperacion.findFirst({
      where: { id: opts.operacionId, clientId: opts.clientId },
    });
    if (!op) return { vehiculoCreado: false, permutasCreadas: 0, op: null };

    let vehiculoCreado = false;
    if (op.tipo === "MANDATO" && !op.vehiculoId) {
      const marca = (op.vehMarca ?? "").trim() || (op.vehiculoTexto ?? "").trim().split(" ")[0] || "";
      const modelo =
        (op.vehModelo ?? "").trim() ||
        (op.vehiculoTexto ?? "").trim().split(" ").slice(1).join(" ") ||
        "—";
      if (marca) {
        const vehiculoId = await crearVehiculoAutomatico(tx, opts.clientId, {
          marca,
          modelo,
          anio: op.vehAnio ?? new Date().getFullYear(),
          km: op.vehKm ?? 0,
          precio: op.precio,
          moneda: op.moneda,
          dominio: op.dominio,
          descripcion: `Ingresó en consignación por el mandato ${numeroOperacion(op.tipo, op.numero)}.`,
          origenTipo: "MANDATO",
          origenOperacionId: op.id,
        });
        await tx.conceOperacion.update({ where: { id: op.id }, data: { vehiculoId } });
        vehiculoCreado = true;
      }
    }

    // Si el mandato ya apuntaba a un vehículo del stock, lo dejamos disponible.
    if (op.tipo === "MANDATO" && op.vehiculoId) {
      await tx.conceVehiculo.updateMany({
        where: { id: op.vehiculoId, clientId: opts.clientId, estado: "vendido" },
        data: { estado: "disponible" },
      });
    }

    const { creados } = await sincronizarPermutas(tx, opts.clientId, op);

    await tx.conceOperacion.update({
      where: { id: op.id },
      data: { estado: "FIRMADO", firmadoEl: op.firmadoEl ?? new Date() },
    });

    return { vehiculoCreado, permutasCreadas: creados, op };
  });

  if (resultado.op) {
    const ref = numeroOperacion(resultado.op.tipo, resultado.op.numero);
    await registrarActividad(
      opts.clientId,
      "operacion_firmada",
      `${ref} — ${resultado.op.nombre}${
        resultado.vehiculoCreado ? " · el vehículo entró al stock sin publicar" : ""
      }${resultado.permutasCreadas > 0 ? ` · ${resultado.permutasCreadas} permuta(s) al stock` : ""}`
    );
  }
  return {
    vehiculoCreado: resultado.vehiculoCreado,
    permutasCreadas: resultado.permutasCreadas,
  };
}

/**
 * Operación anulada: los vehículos que habían entrado SOLOS por ella salen de
 * circulación (sin publicar) y el vehículo reservado por un boleto se libera.
 */
export async function anularOperacion(opts: {
  clientId: string;
  operacionId: string;
}): Promise<void> {
  await db.$transaction(async (tx) => {
    const op = await tx.conceOperacion.findFirst({
      where: { id: opts.operacionId, clientId: opts.clientId },
    });
    if (!op) return;

    // Lo que entró por esta operación vuelve atrás: fuera de la web.
    await tx.conceVehiculo.updateMany({
      where: { clientId: opts.clientId, origenOperacionId: op.id },
      data: { publicado: false, estado: "reservado" },
    });

    // Un boleto cancelado libera el vehículo que tenía reservado.
    if (op.vehiculoId) {
      await tx.conceVehiculo.updateMany({
        where: {
          id: op.vehiculoId,
          clientId: opts.clientId,
          estado: "reservado",
          origenOperacionId: null,
        },
        data: { estado: "disponible" },
      });
    }

    await tx.conceOperacion.update({ where: { id: op.id }, data: { estado: "CANCELADA" } });
  });
  await registrarActividad(opts.clientId, "operacion_cancelada", opts.operacionId);
}

// ── Efectos de "boleto concretado" ────────────────────────────────────────

/**
 * Concreta una operación con TODOS sus efectos (idempotente):
 * - BOLETO con precio → CashMovement de ingreso "Venta de vehículos" en la
 *   cuenta que corresponda a la moneda (USD → cuenta dolares; ARS → efectivo/banco).
 * - BOLETO con vehículo del stock → vehículo pasa a "vendido".
 * - MANDATO concretado con vehículo → vehículo pasa a "vendido" y, si hay
 *   comisión, ingreso "Comisiones por consignación".
 */
export async function concretarOperacion(opts: {
  clientId: string;
  operacionId: string;
}): Promise<void> {
  await db.$transaction(async (tx) => {
    const op = await tx.conceOperacion.findFirst({
      where: { id: opts.operacionId, clientId: opts.clientId },
    });
    if (!op || op.estado === "CONCRETADA") return; // idempotencia

    await tx.conceOperacion.update({
      where: { id: op.id },
      data: { estado: "CONCRETADA" },
    });

    // Vehículo entregado: pasa a VENDIDO, sale del stock disponible y de la
    // web, con la fecha de la entrega.
    if (op.vehiculoId) {
      await tx.conceVehiculo.updateMany({
        where: { id: op.vehiculoId, clientId: opts.clientId },
        data: { estado: "vendido", publicado: false, vendidoEl: new Date() },
      });
    }

    // Permutas tomadas en el boleto → entran al stock (sin publicar).
    await sincronizarPermutas(tx, opts.clientId, op);

    // Ingreso en Finanzas
    const esBoleto = op.tipo === "BOLETO";
    const monto = esBoleto
      ? (op.precio ?? 0)
      : op.precio && op.comisionPct
        ? Math.round(op.precio * (op.comisionPct / 100))
        : 0;
    if (monto <= 0) return;

    const cuenta =
      (await tx.account.findFirst({
        where: {
          clientId: opts.clientId,
          active: true,
          currency: op.moneda === "USD" ? "USD" : "ARS",
        },
        orderBy: { orden: "asc" },
      })) ??
      (await tx.account.findFirst({
        where: { clientId: opts.clientId, active: true },
        orderBy: { orden: "asc" },
      }));
    if (!cuenta) return; // sin Finanzas configuradas: no rompemos

    const vehiculo = op.vehiculoId
      ? await tx.conceVehiculo.findFirst({
          where: { id: op.vehiculoId, clientId: opts.clientId },
          select: { marca: true, modelo: true, version: true, anio: true },
        })
      : null;
    const detalleVehiculo = vehiculo
      ? `${nombreVehiculo(vehiculo)} ${vehiculo.anio}`
      : (op.vehiculoTexto ?? "vehículo");

    await tx.cashMovement.create({
      data: {
        clientId: opts.clientId,
        kind: "venta",
        concept: esBoleto
          ? `Venta ${detalleVehiculo} — ${op.nombre} (Boleto #${op.numero})`
          : `Comisión consignación ${detalleVehiculo} (Mandato #${op.numero})`,
        categoria: esBoleto ? "Venta de vehículos" : "Comisiones por consignación",
        amountArs: monto,
        moneda: cuenta.currency,
        method: op.formaPago === "contado" ? "efectivo" : "transferencia",
        accountId: cuenta.id,
        date: new Date(),
      },
    });
    await recalcularBalances(tx, opts.clientId, [cuenta.id]);
  });

  // Financiación propia de la casa: el plan de cuotas se arma solo.
  const { financiacionDeBoleto } = await import("@/lib/conce-fin-server");
  await financiacionDeBoleto({ clientId: opts.clientId, operacionId: opts.operacionId });

  const op = await db.conceOperacion.findFirst({
    where: { id: opts.operacionId, clientId: opts.clientId },
    select: { tipo: true, numero: true, nombre: true },
  });
  if (op) {
    await registrarActividad(
      opts.clientId,
      "operacion_concretada",
      `${numeroOperacion(op.tipo, op.numero)} — ${op.nombre}`
    );
  }
}
