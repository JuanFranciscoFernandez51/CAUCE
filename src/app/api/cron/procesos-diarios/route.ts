import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { tenantBranding } from "@/lib/tenant";
import { argDateStr, addDays, dayRange, fmtTime } from "@/app/os/[slug]/_lib/dates";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Días sin contacto para considerar una consulta "fría". */
const DIAS_FRIA = 4;

/**
 * CRON DIARIO — acá los Procesos dejan de ser texto y trabajan de verdad.
 * Por cada cliente con el proceso ACTIVO:
 *  - "Recordatorio de turno": arma una tarea por cada turno de MAÑANA,
 *    con el WhatsApp listo para mandar.
 *  - "Seguimiento de consultas frías": arma una tarea por cada contacto
 *    nuevo sin toque hace ≥4 días.
 * Idempotente: no duplica tareas del mismo día. Actualiza ultimaCorrida.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const hoy = argDateStr();
  const manana = addDays(hoy, 1);
  const rangoManana = dayRange(manana);

  const clientes = await db.client.findMany({
    where: { status: "ACTIVE", procesos: { some: { estado: "ACTIVO" } } },
    include: { procesos: { where: { estado: "ACTIVO" } } },
  });

  let recordatorios = 0;
  let seguimientos = 0;
  let avisosCobro = 0;

  for (const c of clientes) {
    const negocio = tenantBranding(c).displayName;
    const tiene = (nombre: string) => c.procesos.find((p) => p.nombre === nombre);

    // ── Recordatorio de turno (turnos de mañana) ──────────
    const pRecordatorio = tiene("Recordatorio de turno");
    if (pRecordatorio) {
      const turnos = await db.appointment.findMany({
        where: {
          clientId: c.id,
          startsAt: { gte: rangoManana.start, lt: rangoManana.end },
          status: { in: ["PENDING", "CONFIRMED"] },
        },
        include: { contact: { select: { id: true, name: true, phone: true } } },
      });
      const yaCreadas = await db.outreachTarea.findMany({
        where: { clientId: c.id, tipo: "recordatorio-turno", fechaProgramada: hoy },
        select: { appointmentId: true },
      });
      const hechas = new Set(yaCreadas.map((t) => t.appointmentId));

      for (const t of turnos) {
        if (hechas.has(t.id)) continue;
        const nombre = t.contact?.name ?? t.title;
        const hora = fmtTime(t.startsAt);
        const mensaje = `Hola ${nombre.split(" ")[0]}! Te recordamos tu turno de mañana a las ${hora} h en ${negocio} (${t.title}). ¿Confirmás? 🙌`;
        await db.outreachTarea.create({
          data: {
            clientId: c.id,
            tipo: "recordatorio-turno",
            contactId: t.contact?.id ?? null,
            appointmentId: t.id,
            nombre,
            telefono: t.contact?.phone ?? null,
            mensaje,
            fechaProgramada: hoy,
          },
        });
        recordatorios++;
      }
      await db.proceso.update({ where: { id: pRecordatorio.id }, data: { ultimaCorrida: new Date() } });
    }

    // ── Seguimiento de consultas frías ────────────────────
    const pSeguimiento = tiene("Seguimiento de consultas frías");
    if (pSeguimiento) {
      const limite = new Date(Date.now() - DIAS_FRIA * 24 * 60 * 60 * 1000);
      const frios = await db.contact.findMany({
        where: {
          clientId: c.id,
          stage: { in: ["nuevo", "contactado"] },
          OR: [{ lastTouchAt: { lt: limite } }, { lastTouchAt: null, createdAt: { lt: limite } }],
        },
        take: 20,
      });
      const yaCreadas = await db.outreachTarea.findMany({
        where: { clientId: c.id, tipo: "seguimiento-consulta", fechaProgramada: hoy },
        select: { contactId: true },
      });
      const hechas = new Set(yaCreadas.map((t) => t.contactId));

      for (const f of frios) {
        if (hechas.has(f.id)) continue;
        const mensaje = `Hola ${f.name.split(" ")[0]}! Te escribimos de ${negocio}: hace unos días nos consultaste y no queremos dejarte colgado. ¿Seguís interesado? Cualquier duda estamos acá 🙌`;
        await db.outreachTarea.create({
          data: {
            clientId: c.id,
            tipo: "seguimiento-consulta",
            contactId: f.id,
            nombre: f.name,
            telefono: f.phone,
            mensaje,
            fechaProgramada: hoy,
          },
        });
        seguimientos++;
      }
      await db.proceso.update({ where: { id: pSeguimiento.id }, data: { ultimaCorrida: new Date() } });
    }

    // ── Aviso de cuotas (ventas con financiación propia) ──
    const pCuotas = tiene("Aviso de cuotas");
    if (pCuotas) {
      const diaHoy = Number(hoy.slice(8, 10));
      const ventas = await db.venta.findMany({
        where: { clientId: c.id, estado: { not: "CANCELADA" }, cuotas: { not: Prisma.DbNull } },
        include: { contact: { select: { id: true, name: true, phone: true } } },
      });
      const yaCreadas = await db.outreachTarea.findMany({
        where: { clientId: c.id, tipo: "aviso-cuota", fechaProgramada: hoy },
        select: { contactId: true },
      });
      const hechas = new Set(yaCreadas.map((t) => t.contactId));

      for (const v of ventas) {
        const cuotas = v.cuotas as { cantidad: number; valorArs: number; diaVencimiento: number } | null;
        if (!cuotas || !v.contact || hechas.has(v.contact.id)) continue;
        // Avisamos 3 días antes del vencimiento (con vuelta de mes simple).
        const diasHasta = (cuotas.diaVencimiento - diaHoy + 31) % 31;
        if (diasHasta !== 3) continue;
        const mensaje = `Hola ${v.contact.name.split(" ")[0]}! Te recordamos que el ${cuotas.diaVencimiento} vence tu cuota de $${Math.round(cuotas.valorArs).toLocaleString("es-AR")} (${v.descripcion}). ¡Gracias! 🙌`;
        await db.outreachTarea.create({
          data: {
            clientId: c.id,
            tipo: "aviso-cuota",
            contactId: v.contact.id,
            nombre: v.contact.name,
            telefono: v.contact.phone,
            mensaje,
            fechaProgramada: hoy,
          },
        });
      }
      await db.proceso.update({ where: { id: pCuotas.id }, data: { ultimaCorrida: new Date() } });
    }

    // ── Aviso de cobro mensual (abonos: pantallas LED, etc.) ──
    // Del 1 al 5 arma el WhatsApp de cobro por cliente con su total del mes.
    const pCobro = tiene("Aviso de cobro mensual");
    if (pCobro) {
      const diaHoy = Number(hoy.slice(8, 10));
      if (diaHoy >= 1 && diaHoy <= 5) {
        const contratos = await db.pantallaContrato.findMany({
          where: { clientId: c.id, estado: "activo", contactId: { not: null } },
          include: {
            contact: { select: { id: true, name: true, phone: true } },
            pantalla: { select: { nombre: true } },
          },
        });
        // Total mensual por contacto (un cliente puede estar en varias pantallas).
        const porContacto = new Map<
          string,
          { nombre: string; telefono: string | null; total: number; pantallas: string[] }
        >();
        for (const ct of contratos) {
          if (!ct.contact) continue;
          const acc = porContacto.get(ct.contact.id) ?? {
            nombre: ct.contact.name,
            telefono: ct.contact.phone,
            total: 0,
            pantallas: [],
          };
          acc.total += ct.montoMensual;
          if (!acc.pantallas.includes(ct.pantalla.nombre)) acc.pantallas.push(ct.pantalla.nombre);
          porContacto.set(ct.contact.id, acc);
        }
        // Dedup por MES: si ya se le avisó algún día de este mes, no se repite.
        const mesActual = hoy.slice(0, 7);
        const yaAvisados = await db.outreachTarea.findMany({
          where: {
            clientId: c.id,
            tipo: "aviso-cobro",
            fechaProgramada: { startsWith: mesActual },
          },
          select: { contactId: true },
        });
        const hechos = new Set(yaAvisados.map((t) => t.contactId));
        const mesNombre = new Date().toLocaleDateString("es-AR", {
          month: "long",
          timeZone: "America/Argentina/Buenos_Aires",
        });

        for (const [contactId, info] of porContacto) {
          if (hechos.has(contactId) || info.total <= 0) continue;
          const mensaje = `Hola ${info.nombre.split(" ")[0]}! Te escribimos de ${negocio} 👋 Te pasamos el detalle de ${mesNombre}: $${Math.round(info.total).toLocaleString("es-AR")} por tu pauta en ${info.pantallas.length === 1 ? info.pantallas[0] : `${info.pantallas.length} pantallas`}. ¡Gracias por seguir con nosotros!`;
          await db.outreachTarea.create({
            data: {
              clientId: c.id,
              tipo: "aviso-cobro",
              contactId,
              nombre: info.nombre,
              telefono: info.telefono,
              mensaje,
              fechaProgramada: hoy,
            },
          });
          avisosCobro++;
        }
      }
      await db.proceso.update({ where: { id: pCobro.id }, data: { ultimaCorrida: new Date() } });
    }

    // Los procesos "de fondo" (CRM, resumen) también marcan que corrieron.
    const pCrm = tiene("Toda consulta entra al CRM");
    if (pCrm) await db.proceso.update({ where: { id: pCrm.id }, data: { ultimaCorrida: new Date() } });
  }

  return NextResponse.json({ ok: true, fecha: hoy, recordatorios, seguimientos, avisosCobro, clientes: clientes.length });
}
