import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seed de Cauce v3…");

  // ── PricingConfig (defaults si no existe; no pisa cambios de Fran) ──
  const { DEFAULT_PRICING } = await import("../src/lib/pricing");
  await db.pricingConfig.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      dolarArs: DEFAULT_PRICING.dolarArs,
      ivaPct: DEFAULT_PRICING.ivaPct,
      packs: DEFAULT_PRICING.packs,
      modulePricing: DEFAULT_PRICING.modulePricing,
      roadmapPriceUsd: DEFAULT_PRICING.roadmapPriceUsd,
      roadmapCredit: DEFAULT_PRICING.roadmapCredit,
    },
    update: {},
  });
  console.log("✅ PricingConfig");

  // ── Admin: Fran ──
  const adminPass = process.env.SEED_ADMIN_PASSWORD || "cauce2026";
  await db.user.upsert({
    where: { username: "fran" },
    create: {
      username: "fran",
      name: "Francisco Fernández",
      role: "ADMIN",
      passwordHash: await bcrypt.hash(adminPass, 10),
    },
    update: {},
  });
  console.log(`✅ admin "fran" (contraseña: ${process.env.SEED_ADMIN_PASSWORD ? "(env)" : "cauce2026 — CAMBIALA"})`);

  // ── Tenant demo: Vespa Bahía (caso real del criterio "SALIÓ") ──
  const vespa = await db.client.upsert({
    where: { slug: "vespabahia" },
    create: {
      name: "Vespa Bahía",
      slug: "vespabahia",
      rubro: "venta y service de scooters",
      pack: "SCALE",
      status: "ACTIVE",
      mrr: 350,
      contactName: "Francisco Fernández",
      email: "administracion@vespabahia.com",
      whatsapp: "+5492914713920",
      branding: {
        displayName: "Vespa Bahía",
        primary: "#1d4ed8",
        accent: "#f97316",
      },
      modules: ["crm", "turnos"],
      customFields: {
        contact: [{ key: "modelo_moto", label: "Modelo de moto", type: "text" }],
        appointment: [{ key: "tipo_service", label: "Tipo de service", type: "select", options: ["Service común", "Service mayor", "Reparación", "Garantía"] }],
      },
      settings: {
        horarios: "Lun a Vie 9-13 y 16-20, Sáb 9-13",
        faqs: [
          { q: "¿Hacen service de Vespa?", a: "Sí, somos especialistas en Vespa y scooters. Service común y mayor con repuestos originales." },
          { q: "¿Venden usadas?", a: "Sí, tenemos Vespas y scooters usados seleccionados con garantía." },
          { q: "¿Trabajan con financiación?", a: "Sí, financiamos con tarjeta y créditos prendarios." },
        ],
      },
    },
    update: {},
  });

  await db.user.upsert({
    where: { username: "vespa" },
    create: {
      username: "vespa",
      name: "Vespa Bahía",
      role: "CLIENT",
      clientId: vespa.id,
      passwordHash: await bcrypt.hash(process.env.SEED_CLIENT_PASSWORD || "vespa2026", 10),
    },
    update: { clientId: vespa.id },
  });

  // Disponibilidad de turnos del taller (Lun-Vie 9-13 / 16-20, Sáb 9-13)
  const avail = await db.availability.count({ where: { clientId: vespa.id } });
  if (avail === 0) {
    const rows: { clientId: string; weekday: number; startTime: string; endTime: string; slotMinutes: number }[] = [];
    for (const d of [1, 2, 3, 4, 5]) {
      rows.push({ clientId: vespa.id, weekday: d, startTime: "09:00", endTime: "13:00", slotMinutes: 60 });
      rows.push({ clientId: vespa.id, weekday: d, startTime: "16:00", endTime: "20:00", slotMinutes: 60 });
    }
    rows.push({ clientId: vespa.id, weekday: 6, startTime: "09:00", endTime: "13:00", slotMinutes: 60 });
    await db.availability.createMany({ data: rows });
  }

  // Procesos demo: los del rubro, desde el catálogo en código
  const existentes = await db.proceso.count({ where: { clientId: vespa.id } });
  if (existentes === 0) {
    const { procesosParaRubro } = await import("../src/lib/procesos-catalogo");
    const procesos = procesosParaRubro(vespa.rubro);
    await db.proceso.createMany({
      data: procesos.map((p, i) => ({
        clientId: vespa.id,
        nombre: p.nombre,
        queHace: p.queHace,
        cuando: p.cuando,
        estado: "ACTIVO" as const,
        orden: i,
      })),
    });
    console.log(`✅ ${procesos.length} procesos demo para Vespa Bahía`);
  }
  console.log("✅ Tenant demo Vespa Bahía (usuario: vespa / vespa2026)");

  console.log("🌊 Seed completo.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
