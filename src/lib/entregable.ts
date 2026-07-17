import type { Client } from "@prisma/client";
import { db } from "@/lib/db";
import { tenantModules } from "@/lib/tenant";

/**
 * MÍNIMO ENTREGABLE — el estándar de Cauce, codificado.
 * Regla de la casa: NO se entrega un cliente con checks en rojo.
 * Esto no es un documento: es el semáforo que se ve en la ficha del cliente.
 */

export type CheckEntrega = {
  key: string;
  label: string;
  ok: boolean;
  detalle: string; // qué falta, en criollo (o qué está bien)
};

type Settings = {
  servicios?: { nombre: string; detalle?: string }[];
  sobre?: string;
  horarios?: string;
  datosNegocio?: { direccion?: string; telefono?: string };
  fotos?: string[];
  shots?: unknown[];
};

const DEFAULT_PRIMARY = "#0f766e";

/** Corre todos los checks del mínimo entregable para un tenant. */
export async function checklistEntrega(client: Client): Promise<CheckEntrega[]> {
  const s = ((client.settings as Settings | null) ?? {}) as Settings;
  const branding = (client.branding as Record<string, unknown> | null) ?? {};
  const modules = tenantModules(client);
  const checks: CheckEntrega[] = [];

  // ── 1. Marca real ──────────────────────────────────────
  const tieneLogo = typeof branding.logo === "string" && branding.logo.length > 0;
  const colorPropio = branding.primary && branding.primary !== DEFAULT_PRIMARY;
  checks.push({
    key: "marca",
    label: "Marca del cliente aplicada",
    ok: Boolean(tieneLogo && colorPropio),
    detalle: tieneLogo && colorPropio
      ? "Logo y colores propios."
      : `Falta: ${[!tieneLogo && "logo", !colorPropio && "colores propios (sigue el default)"].filter(Boolean).join(" + ")}.`,
  });

  const tieneEstilo = Boolean((branding as { estilo?: unknown }).estilo);
  checks.push({
    key: "estilo",
    label: "Terminaciones elegidas con el cliente",
    ok: tieneEstilo,
    detalle: tieneEstilo ? "Esquinas/menú/densidad definidos." : "Elegir estilo con el catálogo (admin → Estilos).",
  });

  // ── 2. Web completa ────────────────────────────────────
  const servicios = s.servicios?.filter((x) => x?.nombre) ?? [];
  checks.push({
    key: "web-servicios",
    label: "Web: servicios cargados (mínimo 3)",
    ok: servicios.length >= 3,
    detalle: servicios.length >= 3 ? `${servicios.length} servicios.` : `Hay ${servicios.length}; cargar al menos 3 reales.`,
  });
  checks.push({
    key: "web-sobre",
    label: "Web: quiénes somos con contenido real",
    ok: (s.sobre ?? "").trim().length >= 120,
    detalle: (s.sobre ?? "").trim().length >= 120 ? "Texto propio del negocio." : "Escribir el 'sobre nosotros' con el cliente (mín. 120 caracteres).",
  });
  checks.push({
    key: "web-horarios",
    label: "Web: horarios visibles",
    ok: Boolean(s.horarios?.trim()),
    detalle: s.horarios?.trim() ? s.horarios : "Cargar los horarios reales de atención.",
  });
  const tieneContacto = Boolean(client.whatsapp || client.phone) && Boolean(s.datosNegocio?.direccion);
  checks.push({
    key: "web-contacto",
    label: "Web: teléfono/WhatsApp + dirección",
    ok: tieneContacto,
    detalle: tieneContacto ? "Datos de contacto completos." : "Cargar WhatsApp y dirección del local.",
  });
  const fotos = s.fotos?.filter(Boolean) ?? [];
  checks.push({
    key: "web-fotos",
    label: "Web: fotos reales del negocio (mínimo 3)",
    ok: fotos.length >= 3,
    detalle: fotos.length >= 3 ? `${fotos.length} fotos en la galería.` : `Hay ${fotos.length}; pedirle fotos al cliente y subirlas.`,
  });

  // ── 3. Sistema con datos vivos ─────────────────────────
  const [contactos, procesosActivos] = await Promise.all([
    db.contact.count({ where: { clientId: client.id } }),
    db.proceso.count({ where: { clientId: client.id, estado: "ACTIVO" } }),
  ]);
  checks.push({
    key: "crm-datos",
    label: "CRM con clientes reales cargados (mínimo 5)",
    ok: contactos >= 5,
    detalle: contactos >= 5 ? `${contactos} contactos.` : `Hay ${contactos}; migrar la agenda del cliente (mín. 5).`,
  });
  checks.push({
    key: "procesos",
    label: "Procesos corriendo (mínimo 3)",
    ok: procesosActivos >= 3,
    detalle: procesosActivos >= 3 ? `${procesosActivos} activos.` : `Hay ${procesosActivos}; activar los del rubro.`,
  });

  // Cada módulo activo tiene que tener AL MENOS un dato real (no pantallas vacías).
  const porModulo: [string, () => Promise<number>, string][] = [
    ["turnos", () => db.availability.count({ where: { clientId: client.id } }), "disponibilidad configurada"],
    ["catalogo", () => db.product.count({ where: { clientId: client.id } }), "productos cargados"],
    ["taller", () => db.ordenTrabajo.count({ where: { clientId: client.id } }), "al menos una OT"],
    ["ventas", () => db.venta.count({ where: { clientId: client.id } }), "al menos una venta"],
    ["eventos", () => db.evento.count({ where: { clientId: client.id } }), "un evento creado"],
    ["caja", () => db.account.count({ where: { clientId: client.id } }), "cuentas de plata creadas"],
  ];
  for (const [mod, contar, que] of porModulo) {
    if (!modules.includes(mod as never)) continue;
    const n = await contar();
    checks.push({
      key: `modulo-${mod}`,
      label: `Módulo ${mod}: con datos, no vacío`,
      ok: n > 0,
      detalle: n > 0 ? `${n} registro(s).` : `Está activo pero vacío — falta ${que}.`,
    });
  }

  // ── 4. Cierre de entrega ───────────────────────────────
  const shots = Array.isArray(s.shots) ? s.shots.length : 0;
  checks.push({
    key: "capturas",
    label: "Capturas para la presentación",
    ok: shots >= 4,
    detalle: shots >= 4 ? `${shots} capturas.` : "Correr scripts/capturar-cliente.ts después de cargar todo.",
  });
  const dueno = await db.user.count({ where: { clientId: client.id } });
  checks.push({
    key: "acceso",
    label: "Acceso del dueño entregado",
    ok: dueno > 0,
    detalle: dueno > 0 ? "Usuario creado." : "Crear el usuario del dueño.",
  });

  return checks;
}
