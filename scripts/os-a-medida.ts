/**
 * Software a medida por cliente (pedido de Fran 12/06):
 * a CADA cliente se le arma su Cauce OS: módulos según el rubro, branding,
 * campos custom de su operación, disponibilidad de turnos y datos de muestra
 * para que el sistema se vea VIVO y a medida.
 * Idempotente (no duplica datos).
 * Uso: npx tsx scripts/os-a-medida.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

type FieldDef = { key: string; label: string; type: "text" | "number" | "date" | "select"; options?: string[] };
type Spec = {
  modules: string[];
  primary: string;
  accent: string;
  contact?: FieldDef[];
  appointment?: FieldDef[];
  sample?: {
    contacts: { name: string; phone: string; stage: string; source: string; notes?: string; custom?: Record<string, string> }[];
    appts?: { title: string; inDays: number; hour: number; status: string; source: string; custom?: Record<string, string> }[];
    tasks?: string[];
  };
};

const SPECS: Record<string, Spec> = {
  estudiocontablegimenez: {
    modules: ["crm", "caja"],
    primary: "#1d4ed8", accent: "#93c5fd",
    contact: [
      { key: "cuit", label: "CUIT", type: "text" },
      { key: "condicion_iva", label: "Condición IVA", type: "select", options: ["Responsable Inscripto", "Monotributo", "Exento"] },
      { key: "vto_honorarios", label: "Vencimiento honorarios", type: "date" },
    ],
    sample: {
      contacts: [
        { name: "Ferretería El Tornillo SRL", phone: "+5492915551001", stage: "cliente", source: "manual", custom: { cuit: "30-71234567-8", condicion_iva: "Responsable Inscripto" }, notes: "Honorarios mensuales, vence el 10" },
        { name: "Kiosco Lula", phone: "+5492915551002", stage: "cliente", source: "manual", custom: { cuit: "27-30111222-3", condicion_iva: "Monotributo" } },
        { name: "Consultora Andina", phone: "+5492915551003", stage: "interesado", source: "bot", notes: "Vino del bot: pidió presupuesto de liquidación de sueldos" },
      ],
      tasks: ["Reclamar honorarios vencidos de Ferretería El Tornillo", "Pasar presupuesto a Consultora Andina"],
    },
  },
  peluquerialucas: {
    modules: ["crm", "turnos"],
    primary: "#9333ea", accent: "#e9d5ff",
    contact: [{ key: "servicio_preferido", label: "Servicio preferido", type: "select", options: ["Corte", "Color", "Barba", "Corte + barba"] }],
    appointment: [{ key: "servicio", label: "Servicio", type: "select", options: ["Corte", "Color", "Barba", "Corte + barba"] }],
    sample: {
      contacts: [
        { name: "Marcos Brizuela", phone: "+5492915552001", stage: "cliente", source: "manual", custom: { servicio_preferido: "Corte + barba" } },
        { name: "Tomás Iglesias", phone: "+5492915552002", stage: "cliente", source: "bot", notes: "Vino del bot: pidió turno solo" },
      ],
      appts: [
        { title: "Corte + barba — Marcos", inDays: 1, hour: 10, status: "CONFIRMED", source: "manual", custom: { servicio: "Corte + barba" } },
        { title: "Corte — Tomás", inDays: 1, hour: 11, status: "PENDING", source: "bot", custom: { servicio: "Corte" } },
      ],
    },
  },
  pizzeriadonvito: {
    modules: ["crm", "catalogo"],
    primary: "#dc2626", accent: "#fde68a",
    contact: [
      { key: "zona_delivery", label: "Zona de delivery", type: "select", options: ["Centro", "Universitario", "Villa Mitre", "Otra"] },
      { key: "pedido_habitual", label: "Pedido habitual", type: "text" },
    ],
    sample: {
      contacts: [
        { name: "Lucía Ferreyra", phone: "+5492915553001", stage: "cliente", source: "bot", custom: { zona_delivery: "Centro", pedido_habitual: "Muzza grande + fainá" }, notes: "Vino del bot: pide todos los viernes" },
        { name: "Hernán Acosta", phone: "+5492915553002", stage: "interesado", source: "bot", notes: "Vino del bot: preguntó por pizza sin TACC" },
      ],
      tasks: ["Cargar promo del finde en el bot"],
    },
  },
  inmobiliariaalvarezpropiedades: {
    modules: ["crm"],
    primary: "#0f766e", accent: "#99f6e4",
    contact: [
      { key: "operacion", label: "Operación", type: "select", options: ["Compra", "Venta", "Alquiler", "Tasación"] },
      { key: "zona", label: "Zona buscada", type: "text" },
      { key: "presupuesto_usd", label: "Presupuesto (USD)", type: "number" },
    ],
    sample: {
      contacts: [
        { name: "Valeria Ponce", phone: "+5492915554001", stage: "interesado", source: "bot", custom: { operacion: "Alquiler", zona: "Centro", presupuesto_usd: "400" }, notes: "Vino del bot: depto 2 amb" },
        { name: "Rodolfo Genta", phone: "+5492915554002", stage: "contactado", source: "manual", custom: { operacion: "Tasación", zona: "Palihue" } },
        { name: "María Inés Vidal", phone: "+5492915554003", stage: "nuevo", source: "bot", custom: { operacion: "Compra", presupuesto_usd: "85000" }, notes: "Vino del bot: consulta de Zonaprop" },
      ],
      tasks: ["Seguimiento presupuesto alquiler Valeria Ponce (toque 2)", "Coordinar tasación en Palihue"],
    },
  },
  tiendanubeurbana: {
    modules: ["crm", "catalogo"],
    primary: "#db2777", accent: "#fbcfe8",
    contact: [
      { key: "talle", label: "Talle habitual", type: "select", options: ["XS", "S", "M", "L", "XL"] },
      { key: "canal", label: "Canal", type: "select", options: ["Instagram", "Web", "WhatsApp"] },
    ],
    sample: {
      contacts: [
        { name: "Agustina Roldán", phone: "+5492915555001", stage: "cliente", source: "bot", custom: { talle: "M", canal: "Instagram" }, notes: "Vino del bot: compró en la campaña de ads" },
        { name: "Camila Funes", phone: "+5492915555002", stage: "interesado", source: "bot", custom: { talle: "S", canal: "Instagram" }, notes: "Vino del bot: preguntó stock del vestido lino" },
      ],
      tasks: ["Reponer talles S del vestido lino (alerta de stock)"],
    },
  },
  distribuidoracarusomayorista: {
    modules: ["crm", "catalogo", "caja"],
    primary: "#b45309", accent: "#fcd34d",
    contact: [
      { key: "cuit", label: "CUIT", type: "text" },
      { key: "lista", label: "Lista de precios", type: "select", options: ["Mayorista A", "Mayorista B", "Minorista"] },
      { key: "dia_reparto", label: "Día de reparto", type: "select", options: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"] },
    ],
    sample: {
      contacts: [
        { name: "Supermercado El Águila", phone: "+5492915556001", stage: "cliente", source: "manual", custom: { cuit: "30-65888999-1", lista: "Mayorista A", dia_reparto: "Martes" } },
        { name: "Almacén Doña Rosa", phone: "+5492915556002", stage: "cliente", source: "manual", custom: { cuit: "27-22333444-5", lista: "Minorista", dia_reparto: "Jueves" } },
        { name: "Kiosco 24hs Alem", phone: "+5492915556003", stage: "interesado", source: "bot", notes: "Vino del bot: pidió lista mayorista" },
      ],
      tasks: ["Revisar diferencias de conciliación MP de ayer", "Confirmar pedido semanal de El Águila"],
    },
  },
  gimnasiofuerzasur: {
    modules: ["crm", "turnos", "rrhh"],
    primary: "#dc2626", accent: "#facc15",
    contact: [
      { key: "plan", label: "Plan", type: "select", options: ["Mensual", "Trimestral", "Anual", "Pase libre"] },
      { key: "vto_plan", label: "Vencimiento del plan", type: "date" },
    ],
    appointment: [{ key: "clase", label: "Clase", type: "select", options: ["Funcional", "Spinning", "Yoga", "Musculación"] }],
    sample: {
      contacts: [
        { name: "Julieta Páez", phone: "+5492915557001", stage: "cliente", source: "manual", custom: { plan: "Mensual" } },
        { name: "Nico Aramburu", phone: "+5492915557002", stage: "cliente", source: "bot", custom: { plan: "Trimestral" }, notes: "Vino del bot: reservó clase solo" },
      ],
      appts: [
        { title: "Funcional 19hs — Julieta", inDays: 1, hour: 19, status: "CONFIRMED", source: "manual", custom: { clase: "Funcional" } },
        { title: "Spinning 20hs — Nico", inDays: 1, hour: 20, status: "PENDING", source: "bot", custom: { clase: "Spinning" } },
      ],
      tasks: ["Armar grilla de profes de la semana que viene"],
    },
  },
  clinicadentaliriarte: {
    modules: ["crm", "turnos", "rrhh"],
    primary: "#0284c7", accent: "#14b8a6",
    contact: [
      { key: "obra_social", label: "Obra social", type: "select", options: ["OSDE", "Swiss Medical", "IOMA", "Particular"] },
      { key: "nro_afiliado", label: "N° de afiliado", type: "text" },
      { key: "ultima_visita", label: "Última visita", type: "date" },
    ],
    appointment: [
      { key: "sillon", label: "Sillón", type: "select", options: ["1", "2", "3"] },
      { key: "tratamiento", label: "Tratamiento", type: "select", options: ["Consulta", "Limpieza", "Conducto", "Ortodoncia", "Extracción"] },
    ],
    sample: {
      contacts: [
        { name: "Graciela Mansilla", phone: "+5492915558001", stage: "cliente", source: "manual", custom: { obra_social: "IOMA", nro_afiliado: "445566/01" } },
        { name: "Pablo Quiroga", phone: "+5492915558002", stage: "cliente", source: "bot", custom: { obra_social: "Particular" }, notes: "Vino del bot: pidió turno por WhatsApp" },
      ],
      appts: [
        { title: "Limpieza — Graciela Mansilla", inDays: 1, hour: 9, status: "CONFIRMED", source: "manual", custom: { sillon: "1", tratamiento: "Limpieza" } },
        { title: "Consulta — Pablo Quiroga", inDays: 2, hour: 10, status: "PENDING", source: "bot", custom: { sillon: "2", tratamiento: "Consulta" } },
      ],
      tasks: ["Migrar fichas de papel a la ficha digital (lote 1)"],
    },
  },
  hotelcostamedanos: {
    modules: ["crm", "caja"],
    primary: "#92400e", accent: "#0ea5e9",
    contact: [
      { key: "origen_reserva", label: "Origen de la reserva", type: "select", options: ["Booking", "WhatsApp", "Instagram", "Repetidor"] },
      { key: "habitacion", label: "Habitación preferida", type: "text" },
      { key: "sena_pendiente", label: "Seña pendiente", type: "select", options: ["Sí", "No"] },
    ],
    sample: {
      contacts: [
        { name: "Familia Ledesma", phone: "+5492915559001", stage: "cliente", source: "bot", custom: { origen_reserva: "WhatsApp", habitacion: "4 (vista al mar)", sena_pendiente: "No" }, notes: "Vino del bot: reservó finde largo" },
        { name: "Sergio Maidana", phone: "+5492915559002", stage: "interesado", source: "bot", custom: { origen_reserva: "Instagram", sena_pendiente: "Sí" }, notes: "Vino del bot: cotizó enero, falta seña" },
      ],
      tasks: ["Perseguir seña de Sergio Maidana (recordatorio automático activo)"],
    },
  },
  tallerfuneshnos: {
    modules: ["crm", "turnos"],
    primary: "#374151", accent: "#f97316",
    contact: [
      { key: "vehiculo", label: "Vehículo", type: "text" },
      { key: "patente", label: "Patente", type: "text" },
      { key: "km", label: "Kilometraje", type: "number" },
    ],
    appointment: [
      { key: "trabajo", label: "Trabajo", type: "select", options: ["Service", "Frenos", "Embrague", "Diagnóstico", "Otro"] },
      { key: "mecanico", label: "Mecánico", type: "select", options: ["Diego", "Martín", "Cacho", "Luis", "Pedro"] },
    ],
    sample: {
      contacts: [
        { name: "Raúl Barrionuevo", phone: "+5492915550901", stage: "cliente", source: "manual", custom: { vehiculo: "Toyota Hilux 2019", patente: "AD123CD", km: "98000" }, notes: "Service cada 10.000 km" },
        { name: "Mónica Sepúlveda", phone: "+5492915550902", stage: "interesado", source: "bot", custom: { vehiculo: "Fiat Cronos 2021", patente: "AE456FG" }, notes: "Vino del bot: pidió turno para frenos" },
      ],
      appts: [
        { title: "Service 100.000 km — Hilux Barrionuevo", inDays: 1, hour: 9, status: "CONFIRMED", source: "manual", custom: { trabajo: "Service", mecanico: "Diego" } },
        { title: "Frenos — Cronos Sepúlveda", inDays: 2, hour: 10, status: "PENDING", source: "bot", custom: { trabajo: "Frenos", mecanico: "Martín" } },
      ],
      tasks: ["Avisar a Barrionuevo que la Hilux está lista (auto listo automático)"],
    },
  },
};

async function main() {
  for (const [slug, spec] of Object.entries(SPECS)) {
    const c = await db.client.findUnique({ where: { slug } });
    if (!c) { console.log(`— no existe ${slug}`); continue; }

    await db.client.update({
      where: { id: c.id },
      data: {
        modules: spec.modules,
        branding: { displayName: c.name, primary: spec.primary, accent: spec.accent },
        customFields: { contact: spec.contact ?? [], appointment: spec.appointment ?? [] },
      },
    });

    // disponibilidad si tiene turnos
    if (spec.modules.includes("turnos")) {
      const n = await db.availability.count({ where: { clientId: c.id } });
      if (n === 0) {
        const rows = [1, 2, 3, 4, 5].map((d) => ({ clientId: c.id, weekday: d, startTime: "09:00", endTime: "18:00", slotMinutes: 30 }));
        rows.push({ clientId: c.id, weekday: 6, startTime: "09:00", endTime: "13:00", slotMinutes: 30 });
        await db.availability.createMany({ data: rows });
      }
    }

    // datos de muestra (idempotente por teléfono)
    const byPhone = new Map<string, string>();
    for (const ct of spec.sample?.contacts ?? []) {
      let row = await db.contact.findFirst({ where: { clientId: c.id, phone: ct.phone } });
      if (!row) {
        row = await db.contact.create({
          data: { clientId: c.id, name: ct.name, phone: ct.phone, stage: ct.stage, source: ct.source, notes: ct.notes, custom: ct.custom ?? {}, lastTouchAt: new Date() },
        });
      }
      byPhone.set(ct.phone, row.id);
    }
    const apptCount = await db.appointment.count({ where: { clientId: c.id } });
    if (apptCount === 0) {
      for (const ap of spec.sample?.appts ?? []) {
        const start = new Date();
        start.setDate(start.getDate() + ap.inDays);
        start.setHours(ap.hour, 0, 0, 0);
        const end = new Date(start.getTime() + 36e5 / 2);
        await db.appointment.create({
          data: {
            clientId: c.id, title: ap.title, startsAt: start, endsAt: end,
            status: ap.status as never, source: ap.source, custom: ap.custom ?? {},
            contactId: byPhone.values().next().value ?? null,
          },
        });
      }
    }
    const taskCount = await db.crmTask.count({ where: { clientId: c.id } });
    if (taskCount === 0) {
      for (const t of spec.sample?.tasks ?? []) {
        await db.crmTask.create({ data: { clientId: c.id, title: t, dueAt: new Date(Date.now() + 2 * 864e5) } });
      }
    }
    console.log(`✅ ${c.name}: ${spec.modules.join("+")} · ${spec.contact?.length ?? 0} campos contacto · ${spec.appointment?.length ?? 0} campos turno · datos de muestra`);
  }
  console.log("\n🌊 Software a medida listo para los 10 clientes.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
