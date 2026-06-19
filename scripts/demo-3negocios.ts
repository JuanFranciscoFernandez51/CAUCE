/**
 * 3 negocios complejos de demostración (pedido de Fran):
 * - Pulso Studio (agencia de marketing): proyectos + equipo + cuentas + caja
 * - Marenco Propiedades (inmobiliaria): catálogo de propiedades + CRM + visitas + sitio web
 * - Lume Studio (peluquería): turnos por estilista + insumos + caja + clientes
 * Idempotente (skip si el cliente ya existe). Uso: npx tsx scripts/demo-3negocios.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const at = (daysFromNow: number, h = 12) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(h, 0, 0, 0);
  return d;
};

async function ensureClient(opts: {
  slug: string; name: string; rubro: string; modules: string[];
  primary: string; accent: string; mrr: number; pack: "PRO" | "SCALE" | "CUSTOM";
  contactName: string; whatsapp: string; email: string; domain?: string;
}) {
  let c = await db.client.findUnique({ where: { slug: opts.slug } });
  if (!c) {
    c = await db.client.create({
      data: {
        slug: opts.slug, name: opts.name, rubro: opts.rubro, status: "ACTIVE",
        pack: opts.pack, mrr: opts.mrr, modules: opts.modules,
        branding: { displayName: opts.name, primary: opts.primary, accent: opts.accent },
        contactName: opts.contactName, whatsapp: opts.whatsapp, email: opts.email,
        domain: opts.domain ?? null,
      },
    });
    await db.user.create({
      data: { username: opts.slug, name: opts.contactName, role: "CLIENT", clientId: c.id, osRole: "dueno", passwordHash: await bcrypt.hash(opts.slug + "2026", 10) },
    });
    await db.subscription.create({ data: { clientId: c.id, pack: opts.pack, monthlyUsd: opts.mrr, status: "ACTIVE" } });
  } else {
    await db.client.update({ where: { id: c.id }, data: { modules: opts.modules, branding: { displayName: opts.name, primary: opts.primary, accent: opts.accent }, domain: opts.domain ?? c.domain } });
  }
  return c;
}

async function empleados(clientId: string, list: { name: string; role: string }[]) {
  if ((await db.employee.count({ where: { clientId } })) > 0) return db.employee.findMany({ where: { clientId } });
  for (const e of list) await db.employee.create({ data: { clientId, name: e.name, role: e.role, active: true } });
  return db.employee.findMany({ where: { clientId } });
}

async function cuentas(clientId: string) {
  if ((await db.account.count({ where: { clientId } })) > 0) return;
  await db.account.createMany({ data: [
    { clientId, name: "Efectivo", kind: "efectivo", currency: "ARS", balance: 0 },
    { clientId, name: "Mercado Pago", kind: "mp", currency: "ARS", balance: 0 },
    { clientId, name: "Banco", kind: "banco", currency: "ARS", balance: 0 },
  ]});
  const accs = await db.account.findMany({ where: { clientId } });
  const saldos: Record<string, number> = {};
  for (let m = 0; m <= 5; m++) {
    const acc = accs[m % accs.length];
    const venta = 320000 + m * 45000;
    await db.cashMovement.create({ data: { clientId, kind: "venta", concept: m === 0 ? "Cobranzas del mes (en curso)" : "Cobranzas consolidadas", amountArs: venta, method: "transferencia", accountId: acc.id, date: at(-m * 30) } });
    const gasto = 95000 + m * 12000;
    await db.cashMovement.create({ data: { clientId, kind: "gasto", concept: "Gastos operativos", amountArs: gasto, method: "efectivo", accountId: accs[0].id, date: at(-m * 30 - 1) } });
    saldos[acc.id] = (saldos[acc.id] ?? 0) + venta;
    saldos[accs[0].id] = (saldos[accs[0].id] ?? 0) - gasto;
  }
  for (const acc of accs) await db.account.update({ where: { id: acc.id }, data: { balance: Math.round(saldos[acc.id] ?? 0) } });
}

async function contactos(clientId: string, list: { name: string; phone: string; stage: string; source: string; notes?: string; custom?: Record<string, string> }[]) {
  if ((await db.contact.count({ where: { clientId } })) > 0) return;
  for (const [i, ct] of list.entries()) {
    await db.contact.create({ data: { clientId, name: ct.name, phone: ct.phone, stage: ct.stage, source: ct.source, notes: ct.notes, custom: ct.custom ?? {}, lastTouchAt: at(-i * 9) } });
  }
}

async function disponibilidad(clientId: string) {
  if ((await db.availability.count({ where: { clientId } })) > 0) return;
  const rows = [1, 2, 3, 4, 5].map((d) => ({ clientId, weekday: d, startTime: "09:00", endTime: "19:00", slotMinutes: 30 }));
  rows.push({ clientId, weekday: 6, startTime: "09:00", endTime: "14:00", slotMinutes: 30 });
  await db.availability.createMany({ data: rows });
}

async function main() {
  // ───────────────────────── 1) AGENCIA DE MARKETING ─────────────────────────
  const agencia = await ensureClient({
    slug: "pulso-studio", name: "Pulso Studio", rubro: "agencia de marketing y publicidad",
    modules: ["crm", "proyectos", "rrhh", "caja"], primary: "#7c3aed", accent: "#22d3ee",
    mrr: 600, pack: "SCALE", contactName: "Caro Vidal", whatsapp: "+5492914820001", email: "hola@pulsostudio.com",
  });
  const equipoAg = await empleados(agencia.id, [
    { name: "Caro Vidal", role: "Directora" }, { name: "Nacho Rivas", role: "Diseñador" },
    { name: "Flor Quintana", role: "Community Manager" }, { name: "Beto Sosa", role: "Pauta / Ads" },
    { name: "Mica Duarte", role: "Redactora" },
  ]);
  await cuentas(agencia.id);
  await contactos(agencia.id, [
    { name: "Bodega Alto Valle", phone: "+5492914820101", stage: "cliente", source: "manual", custom: { industria: "Vinos" } },
    { name: "Gimnasio Energy", phone: "+5492914820102", stage: "cliente", source: "manual", custom: { industria: "Fitness" } },
    { name: "Óptica Visión", phone: "+5492914820103", stage: "interesado", source: "bot", notes: "Pidió propuesta de redes" },
    { name: "Heladería Polo Norte", phone: "+5492914820104", stage: "cliente", source: "manual" },
    { name: "Constructora Sur", phone: "+5492914820105", stage: "nuevo", source: "bot", notes: "Quiere rebranding" },
  ]);
  if ((await db.proyecto.count({ where: { clientId: agencia.id } })) === 0) {
    const proys = [
      { name: "Rebranding Bodega Alto Valle", clienteName: "Bodega Alto Valle", area: "branding", status: "en_curso", budgetUsd: 3500, dueIn: 18,
        tareas: [["Investigación de marca", "hecho"], ["Propuesta de logo", "revision"], ["Manual de marca", "haciendo"], ["Aplicaciones (etiquetas)", "pendiente"]] },
      { name: "Campaña verano Energy", clienteName: "Gimnasio Energy", area: "ads", status: "en_curso", budgetUsd: 1800, dueIn: 7,
        tareas: [["Definir audiencias", "hecho"], ["Creativos (5 piezas)", "haciendo"], ["Carga en Meta Ads", "pendiente"], ["Reporte semanal", "pendiente"]] },
      { name: "Contenido mensual Polo Norte", clienteName: "Heladería Polo Norte", area: "redes", status: "en_curso", budgetUsd: 900, dueIn: 3,
        tareas: [["Calendario de 20 posts", "revision"], ["Sesión de fotos", "hecho"], ["Diseño de placas", "haciendo"]] },
      { name: "Sitio web Óptica Visión", clienteName: "Óptica Visión", area: "web", status: "propuesta", budgetUsd: 2200, dueIn: 30,
        tareas: [["Relevamiento", "pendiente"], ["Wireframes", "pendiente"]] },
      { name: "Lanzamiento Constructora Sur", clienteName: "Constructora Sur", area: "branding", status: "entregado", budgetUsd: 4000, dueIn: -5,
        tareas: [["Naming", "hecho"], ["Identidad visual", "hecho"], ["Brochure", "hecho"]] },
    ];
    for (const p of proys) {
      const proy = await db.proyecto.create({ data: { clientId: agencia.id, name: p.name, clienteName: p.clienteName, area: p.area, status: p.status, budgetUsd: p.budgetUsd, startDate: at(-20), dueDate: at(p.dueIn), description: `Proyecto de ${p.area} para ${p.clienteName}.` } });
      for (const [i, [title, status]] of p.tareas.entries()) {
        await db.proyectoTarea.create({ data: { clientId: agencia.id, proyectoId: proy.id, title, status, assigneeId: equipoAg[(i + 1) % equipoAg.length].id, dueAt: at(p.dueIn - i), hours: 4 + i * 2, orderIdx: i } });
      }
    }
  }

  // ───────────────────────── 2) INMOBILIARIA ─────────────────────────
  const inmo = await ensureClient({
    slug: "marenco-propiedades", name: "Marenco Propiedades", rubro: "inmobiliaria",
    modules: ["crm", "turnos", "caja", "sitio"], primary: "#1e3a5f", accent: "#cdbb97",
    mrr: 500, pack: "SCALE", contactName: "Luis Marenco", whatsapp: "+5492914830001", email: "info@marencopropiedades.com",
  });
  await cuentas(inmo.id);
  await disponibilidad(inmo.id);
  await contactos(inmo.id, [
    { name: "Andrea Gómez", phone: "+5492914830101", stage: "interesado", source: "sitio web", custom: { operacion: "Alquiler", zona: "Centro", presupuesto_usd: "450" }, notes: "Busca 2 amb para alquilar" },
    { name: "Marcelo Pérez", phone: "+5492914830102", stage: "consulta", source: "sitio web", custom: { operacion: "Compra", zona: "Palihue", presupuesto_usd: "120000" } },
    { name: "Familia Ledesma", phone: "+5492914830103", stage: "visita", source: "manual", custom: { operacion: "Compra", zona: "Universitario" }, notes: "Visita agendada casa Universitario" },
    { name: "Sofía Arce", phone: "+5492914830104", stage: "nuevo", source: "sitio web", custom: { operacion: "Alquiler temporal" } },
    { name: "Inversor Grupo BB", phone: "+5492914830105", stage: "interesado", source: "manual", custom: { operacion: "Compra", presupuesto_usd: "300000" }, notes: "Busca locales para renta" },
  ]);
  if ((await db.listing.count({ where: { clientId: inmo.id } })) === 0) {
    const props = [
      { title: "Departamento 2 ambientes a estrenar", operation: "venta", propertyType: "departamento", priceUsd: 89000, neighborhood: "Centro", bedrooms: 1, bathrooms: 1, areaM2: 52, coveredM2: 48, featured: true, amenities: ["Cochera", "Balcón", "A estrenar"] },
      { title: "Casa 3 dormitorios con jardín", operation: "venta", propertyType: "casa", priceUsd: 175000, neighborhood: "Palihue", bedrooms: 3, bathrooms: 2, areaM2: 320, coveredM2: 160, featured: true, amenities: ["Jardín", "Parrilla", "Cochera doble"] },
      { title: "PH reciclado 3 ambientes", operation: "venta", propertyType: "ph", priceUsd: 112000, neighborhood: "Universitario", bedrooms: 2, bathrooms: 1, areaM2: 95, coveredM2: 78, featured: true, amenities: ["Patio", "Reciclado"] },
      { title: "Monoambiente luminoso", operation: "alquiler", priceArs: 290000, propertyType: "departamento", neighborhood: "Centro", bedrooms: 0, bathrooms: 1, areaM2: 34, expensesArs: 45000, amenities: ["Amoblado"] },
      { title: "Local comercial sobre avenida", operation: "alquiler", priceArs: 850000, propertyType: "local", neighborhood: "Centro", bathrooms: 1, areaM2: 120, amenities: ["Vidriera", "Sobre avenida"] },
      { title: "Casa quinta con pileta", operation: "venta", propertyType: "casa", priceUsd: 240000, neighborhood: "Cabildo", bedrooms: 4, bathrooms: 3, areaM2: 1200, coveredM2: 240, featured: true, amenities: ["Pileta", "Quincho", "Parque"] },
      { title: "Departamento 3 amb con cochera", operation: "alquiler", priceArs: 520000, propertyType: "departamento", neighborhood: "Universitario", bedrooms: 2, bathrooms: 1, areaM2: 78, expensesArs: 80000, amenities: ["Cochera", "Lavadero"] },
      { title: "Terreno 500m² apto dúplex", operation: "venta", propertyType: "terreno", priceUsd: 65000, neighborhood: "Patagonia", areaM2: 500, amenities: ["Esquina", "Servicios"] },
      { title: "Oficina en edificio corporativo", operation: "alquiler", priceArs: 410000, propertyType: "oficina", neighborhood: "Centro", bathrooms: 1, areaM2: 45, amenities: ["Aire", "Seguridad 24h"] },
      { title: "Departamento temporal frente al mar", operation: "alquiler_temporal", priceUsd: 70, propertyType: "departamento", city: "Monte Hermoso", bedrooms: 2, bathrooms: 1, areaM2: 60, amenities: ["Vista al mar", "Wifi", "Amoblado"] },
    ];
    for (const [i, p] of props.entries()) {
      await db.listing.create({ data: { clientId: inmo.id, slug: slugify(p.title) + "-" + (i + 1), title: p.title, operation: p.operation, propertyType: p.propertyType, status: "disponible", priceUsd: p.priceUsd ?? null, priceArs: p.priceArs ?? null, expensesArs: p.expensesArs ?? null, neighborhood: p.neighborhood ?? null, city: p.city ?? "Bahía Blanca", bedrooms: p.bedrooms ?? null, bathrooms: p.bathrooms ?? null, areaM2: p.areaM2 ?? null, coveredM2: p.coveredM2 ?? null, description: `${p.title}. Excelente oportunidad en ${p.neighborhood ?? p.city ?? "zona premium"}. Consultá por una visita.`, amenities: p.amenities ?? [], photos: [`https://picsum.photos/seed/marenco${i}a/800/600`, `https://picsum.photos/seed/marenco${i}b/800/600`, `https://picsum.photos/seed/marenco${i}c/800/600`], featured: p.featured ?? false, active: true } });
    }
  }
  // visitas (turnos) para la inmobiliaria
  if ((await db.appointment.count({ where: { clientId: inmo.id } })) === 0) {
    const cs = await db.contact.findMany({ where: { clientId: inmo.id }, take: 3 });
    await db.appointment.create({ data: { clientId: inmo.id, contactId: cs[0]?.id, title: "Visita depto Centro", startsAt: at(0, 11), endsAt: at(0, 12), status: "CONFIRMED", source: "manual" } });
    await db.appointment.create({ data: { clientId: inmo.id, contactId: cs[2]?.id, title: "Visita casa Universitario", startsAt: at(1, 16), endsAt: at(1, 17), status: "PENDING", source: "sitio web" } });
    await db.appointment.create({ data: { clientId: inmo.id, title: "Tasación Palihue", startsAt: at(2, 10), endsAt: at(2, 11), status: "CONFIRMED", source: "manual" } });
  }

  // ───────────────────────── 3) PELUQUERÍA ─────────────────────────
  const pelu = await ensureClient({
    slug: "lume-studio", name: "Lume Studio", rubro: "peluquería y estética",
    modules: ["turnos", "crm", "caja", "catalogo"], primary: "#be185d", accent: "#f9a8d4",
    mrr: 300, pack: "PRO", contactName: "Romina Lume", whatsapp: "+5492914840001", email: "turnos@lumestudio.com",
  });
  const equipoPel = await empleados(pelu.id, [
    { name: "Romina Lume", role: "Dueña / Colorista" }, { name: "Dai Robles", role: "Estilista" },
    { name: "Juli Paz", role: "Estilista" }, { name: "Aldo Britos", role: "Barbero" },
  ]);
  await cuentas(pelu.id);
  await disponibilidad(pelu.id);
  await contactos(pelu.id, [
    { name: "Vale Sánchez", phone: "+5492914840101", stage: "cliente", source: "bot", custom: { servicio_preferido: "Color" } },
    { name: "Caro Núñez", phone: "+5492914840102", stage: "cliente", source: "manual", custom: { servicio_preferido: "Corte" } },
    { name: "Migue Torres", phone: "+5492914840103", stage: "cliente", source: "bot", custom: { servicio_preferido: "Barba" } },
    { name: "Pao Giménez", phone: "+5492914840104", stage: "nuevo", source: "bot", notes: "Pidió turno por WhatsApp" },
  ]);
  // turnos de hoy y semana por estilista
  if ((await db.appointment.count({ where: { clientId: pelu.id } })) === 0) {
    const cs = await db.contact.findMany({ where: { clientId: pelu.id } });
    const mk = (title: string, d: number, h: number, empIdx: number, ctIdx: number, status: string, source: string) =>
      db.appointment.create({ data: { clientId: pelu.id, title, startsAt: at(d, h), endsAt: at(d, h + 1), status: status as never, source, employeeId: equipoPel[empIdx]?.id, contactId: cs[ctIdx]?.id, custom: {} } });
    await mk("Color + corte — Vale", 0, 10, 0, 0, "CONFIRMED", "manual");
    await mk("Corte — Caro", 0, 12, 1, 1, "CONFIRMED", "bot");
    await mk("Barba — Migue", 0, 16, 3, 2, "PENDING", "bot");
    await mk("Brushing — Pao", 1, 11, 2, 3, "PENDING", "bot");
    await mk("Color — Vale", 3, 15, 0, 0, "PENDING", "manual");
  }
  // insumos (catálogo con stock interno)
  if ((await db.product.count({ where: { clientId: pelu.id } })) === 0) {
    await db.product.createMany({ data: [
      { clientId: pelu.id, name: "Shampoo profesional 1L", priceArs: 18500, stock: 6, minStock: 4 },
      { clientId: pelu.id, name: "Tintura rubio 8.0", priceArs: 4200, stock: 3, minStock: 6 },
      { clientId: pelu.id, name: "Tintura castaño 5.0", priceArs: 4200, stock: 2, minStock: 6 },
      { clientId: pelu.id, name: "Oxidante 30vol 900ml", priceArs: 6800, stock: 5, minStock: 3 },
      { clientId: pelu.id, name: "Crema de enjuague 1L", priceArs: 15200, stock: 1, minStock: 4 },
      { clientId: pelu.id, name: "Espuma fijadora", priceArs: 7900, stock: 8, minStock: 3 },
      { clientId: pelu.id, name: "Toallas descartables x100", priceArs: 9500, stock: 0, minStock: 2 },
    ]});
  }

  console.log("✅ 3 negocios creados/actualizados:");
  console.log("  • Pulso Studio (agencia)   → /os/pulso-studio        · pulso-studio/pulso-studio2026");
  console.log("  • Marenco Propiedades      → /os/marenco-propiedades · sitio: /sitio/marenco-propiedades · marenco-propiedades/marenco-propiedades2026");
  console.log("  • Lume Studio (peluquería) → /os/lume-studio         · agendá: /agendar/lume-studio · lume-studio/lume-studio2026");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
